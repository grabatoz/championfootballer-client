/*
Page & API latency measurement script.
Measures TTFB and total time for configured endpoints and SSE first event latency.
Usage:
  CF_AUTH_TOKEN=yourtoken node scripts/page-latency.js
*/

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const EventSource = require('eventsource');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
// Optional separate API base for SSE if /events served by backend not Next.js
const API_BASE_URL = process.env.API_BASE_URL || BASE_URL;
const AUTH_TOKEN = process.env.CF_AUTH_TOKEN || process.env.AUTH_TOKEN || '';

// Pages to test
const pages = ['/', '/all-matches', '/all-leagues', '/world-ranking'];

function chooseAgent(url) {
  return url.startsWith('https') ? https : http;
}

function measureUrl(path) {
  const initialUrl = BASE_URL.replace(/\/$/, '') + path;
  return new Promise((resolve) => {
    const timings = { path, url: initialUrl, ttfb: 0, total: 0, status: 0, bytes: 0, redirects: [] };
    const start = performance.now();
    let hop = 0;
    let firstTTFBRecorded = false;
    function request(url) {
      const agent = chooseAgent(url);
      const options = new URL(url);
      options.method = 'GET';
      options.headers = {
        'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8',
        'Connection': 'keep-alive'
      };
      if (AUTH_TOKEN) options.headers['Authorization'] = 'Bearer ' + AUTH_TOKEN;
      const req = agent.request(options, (res) => {
        if (!firstTTFBRecorded) {
          res.once('data', () => {
            timings.ttfb = performance.now() - start;
            firstTTFBRecorded = true;
          });
        }
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location && hop < 5) {
          timings.redirects.push({ status, location: res.headers.location });
          hop++;
          const nextUrl = res.headers.location.startsWith('http') ? res.headers.location : BASE_URL.replace(/\/$/, '') + res.headers.location;
          return request(nextUrl);
        }
        timings.status = status;
        res.on('data', (chunk) => { timings.bytes += chunk.length; });
        res.on('end', () => {
          timings.url = url;
          timings.total = performance.now() - start;
          resolve(timings);
        });
      });
      req.on('error', (err) => {
        timings.error = err.message;
        timings.total = performance.now() - start;
        resolve(timings);
      });
      req.end();
    }
    request(initialUrl);
  });
}

async function measureSSE() {
  const sseUrl = API_BASE_URL.replace(/\/$/, '') + '/events';
  const start = performance.now();
  return new Promise((resolve) => {
    const headers = {};
    if (AUTH_TOKEN) headers['Authorization'] = 'Bearer ' + AUTH_TOKEN;
    const es = new EventSource(sseUrl, { headers });
    let done = false;
    es.onmessage = () => {
      if (!done) {
        done = true;
        const latency = performance.now() - start;
        es.close();
        resolve({ sseUrl, firstEventLatency: latency });
      }
    };
    es.onerror = (e) => {
      if (!done) {
        done = true;
        resolve({ sseUrl, error: 'SSE connection error' });
      }
      es.close();
    };
    // Timeout after 10s
    setTimeout(() => {
      if (!done) {
        done = true;
        es.close();
        resolve({ sseUrl, error: 'Timeout waiting first event >10s' });
      }
    }, 10000);
  });
}

function format(ms) { return (ms).toFixed(1) + 'ms'; }

async function run() {
  console.log('Base:', BASE_URL);
  if (API_BASE_URL !== BASE_URL) console.log('API Base:', API_BASE_URL);
  if (AUTH_TOKEN) console.log('Auth: Bearer **** (hidden)');
  console.log('\nMeasuring pages...');
  const results = [];
  for (const p of pages) {
    // cold
    const cold = await measureUrl(p);
    // warm (repeat once)
    const warm = await measureUrl(p);
    results.push({ path: p, cold, warm });
  }

  console.log('\nPage Latencies:');
  for (const r of results) {
    const { path, cold, warm } = r;
    const redirCold = cold.redirects.length ? ` ->${cold.redirects.map(r=>r.status).join('/')}` : '';
    const redirWarm = warm.redirects.length ? ` ->${warm.redirects.map(r=>r.status).join('/')}` : '';
    console.log(`${path.padEnd(18)} | status ${cold.status}${redirCold}/${warm.status}${redirWarm} | TTFB cold ${format(cold.ttfb)}, warm ${format(warm.ttfb)} | Total cold ${format(cold.total)}, warm ${format(warm.total)} | bytes ${cold.bytes}/${warm.bytes}${cold.error ? ' ERR:'+cold.error : ''}`);
  }

  console.log('\nMeasuring SSE first event latency...');
  const sse = await measureSSE();
  if (sse.error) {
    console.log('SSE Error:', sse.error);
  } else {
    console.log(`SSE first event latency: ${format(sse.firstEventLatency)}`);
  }

  // Summary / Averages
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  const ttfbColdAvg = avg(results.map(r => r.cold.ttfb));
  const ttfbWarmAvg = avg(results.map(r => r.warm.ttfb));
  console.log(`\nAverage TTFB cold: ${format(ttfbColdAvg)} | warm: ${format(ttfbWarmAvg)}`);
  const totalColdAvg = avg(results.map(r => r.cold.total));
  const totalWarmAvg = avg(results.map(r => r.warm.total));
  console.log(`Average Total cold: ${format(totalColdAvg)} | warm: ${format(totalWarmAvg)}`);

  // Basic guidance thresholds (customizable)
  const guidance = [];
  if (ttfbColdAvg > 400) guidance.push('High cold TTFB: consider CDN or server warmup.');
  if (totalColdAvg > 1200) guidance.push('Cold total load >1.2s: enable more caching / reduce SSR work.');
  if (ttfbWarmAvg > 200) guidance.push('Warm TTFB should be <200ms; check keep-alive and DB connections.');
  if (!AUTH_TOKEN) guidance.push('Provide CF_AUTH_TOKEN to test authenticated paths accurately.');

  console.log('\nGuidance:');
  if (guidance.length === 0) console.log('All baseline thresholds OK.');
  else guidance.forEach(g => console.log('- ' + g));
}

run().catch(e => { console.error('Fatal error:', e); process.exit(1); });

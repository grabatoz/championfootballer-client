/*
 Simple client-side-ish performance probe for Next pages & API endpoints.
 Usage: yarn perf:client

 It will:
 1. Probe a set of Next.js pages (HTML fetch) twice (cold & warm) and measure latency.
 2. Optionally probe API endpoints if NEXT_PUBLIC_API_URL is defined.
 3. Attempt an ETag conditional revalidation on one API endpoint to verify 304 fast path.

 NOTE: Run after starting standalone server:
   node .next-build/standalone/server.js
*/

const pages = ['/', '/all-matches', '/all-leagues', '/world-ranking'];
const apiEnv = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const apiEndpoints = ['/api/world-ranking', '/api/matches', '/api/leagues'];
const authToken = process.env.PERF_AUTH_TOKEN || process.env.TOKEN || process.env.AUTH_TOKEN;
const nextBase = process.env.PERF_NEXT_BASE || 'http://localhost:3000';

function hrMs(start) {
  const diff = process.hrtime.bigint() - start;
  return Number(diff) / 1e6;
}

async function fetchWithTiming(url, opts = {}) {
  const start = process.hrtime.bigint();
  const headers = { ...(opts.headers || {}) };
  if (authToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(url, { ...opts, headers });
  const timeMs = hrMs(start).toFixed(1);
  const size = Number(res.headers.get('content-length') || 0);
  return { res, timeMs, size };
}

(async () => {
  const report = { pages: [], api: [], etag: null };
  console.log('=== Page Latency (Cold) ===');
  for (const p of pages) {
    try {
      const { res, timeMs } = await fetchWithTiming(nextBase + p);
      report.pages.push({ page: p, coldMs: timeMs, warmMs: null, status: res.status });
      console.log(`${p.padEnd(18)} => ${timeMs} ms (status ${res.status})`);
    } catch (e) {
      console.log(`${p} ERROR:`, e.message);
    }
  }
  console.log('\n=== Page Latency (Warm) ===');
  for (const entry of report.pages) {
    try {
      const { res, timeMs } = await fetchWithTiming(nextBase + entry.page);
      entry.warmMs = timeMs;
      console.log(`${entry.page.padEnd(18)} => ${timeMs} ms (status ${res.status})`);
    } catch (e) {
      console.log(`${entry.page} ERROR:`, e.message);
    }
  }

  // API endpoints
  console.log('\n=== API Latency (Cold) ===');
  for (const ep of apiEndpoints) {
    const full = apiEnv.replace(/\/$/, '') + ep;
    try {
      const { res, timeMs } = await fetchWithTiming(full);
      let etag = res.headers.get('ETag');
      report.api.push({ endpoint: ep, coldMs: timeMs, warmMs: null, status: res.status, etag });
      console.log(`${ep.padEnd(20)} => ${timeMs} ms (status ${res.status}) ETag=${etag || '-'} `);
    } catch (e) {
      console.log(`${ep} ERROR:`, e.message);
    }
  }
  console.log('\n=== API Latency (Warm / Cached) ===');
  for (const entry of report.api) {
    const full = apiEnv.replace(/\/$/, '') + entry.endpoint;
    try {
      const headers = {};
      if (entry.etag) headers['If-None-Match'] = entry.etag;
      const start = process.hrtime.bigint();
      const res = await fetchWithTiming(full, { headers });
      const timeMs = hrMs(start).toFixed(1);
      entry.warmMs = timeMs;
      const was304 = res.status === 304;
      console.log(`${entry.endpoint.padEnd(20)} => ${timeMs} ms (status ${res.status}${was304 ? ' 304(Not Modified)' : ''})`);
      if (!report.etag && was304) {
        report.etag = { endpoint: entry.endpoint, latencyMs: timeMs };
      }
    } catch (e) {
      console.log(`${entry.endpoint} ERROR:`, e.message);
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  const avgColdPages = avg(report.pages.map(p => parseFloat(p.coldMs)).filter(Boolean));
  const avgWarmPages = avg(report.pages.map(p => parseFloat(p.warmMs)).filter(Boolean));
  const avgColdApi = avg(report.api.map(a => parseFloat(a.coldMs)).filter(Boolean));
  const avgWarmApi = avg(report.api.map(a => parseFloat(a.warmMs)).filter(Boolean));

  console.log(`Pages avg cold: ${avgColdPages.toFixed(1)} ms, warm: ${avgWarmPages.toFixed(1)} ms`);
  console.log(`API   avg cold: ${avgColdApi.toFixed(1)} ms, warm: ${avgWarmApi.toFixed(1)} ms`);
  if (report.etag) {
    console.log(`ETag 304 verified on ${report.etag.endpoint} at ${report.etag.latencyMs} ms`);
  } else {
    console.log('No 304 ETag revalidation observed (ensure server sends ETag and supports If-None-Match).');
  }

  // Threshold checks (customizable)
  const warnings = [];
  if (avgColdPages > 800) warnings.push('Cold page loads >800ms average');
  if (avgWarmPages > 300) warnings.push('Warm page loads >300ms average');
  if (avgColdApi > 500) warnings.push('Cold API latency >500ms average');
  if (avgWarmApi > 250) warnings.push('Warm API latency >250ms average');

  if (!warnings.length) console.log('All latency thresholds PASS.');
  else {
    console.log('Warnings:');
    warnings.forEach(w => console.log(' - ' + w));
  }

  function avg(arr) { return arr.reduce((a, b) => a + b, 0) / (arr.length || 1); }
})();

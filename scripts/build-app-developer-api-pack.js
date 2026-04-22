const fs = require('fs');
const path = require('path');

const root = process.cwd();
const inputPath = path.join(root, 'docs', 'api-inventory.json');
const outputMdPath = path.join(root, 'docs', 'API_For_App_Developer.md');

function unique(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function extractParamName(expr) {
  if (!expr) return 'param';
  const blacklist = new Set([
    'encodeURIComponent',
    'decodeURIComponent',
    'String',
    'Number',
    'Date',
    'now',
    'toString',
    'process',
    'env',
    'NEXT_PUBLIC_API_URL',
    'API_BASE_URL',
    'Math',
    'floor',
  ]);
  const ids = expr.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
  const clean = ids.filter((id) => !blacklist.has(id));
  if (clean.length === 0) return 'param';
  return clean[clean.length - 1];
}

function canonicalizeUrl(raw) {
  if (!raw || !raw.includes('{BASE_URL}')) return null;
  let url = raw.trim();

  // Drop generic/non-actionable templated utilities.
  if (
    /\$\{(?:endpoint|item\.endpoint|key|resourceType|task\.url)\}/.test(url) ||
    /\+\s*endpoint/.test(url) ||
    /\|\|/.test(url)
  ) {
    return null;
  }

  // Replace template expressions with :param style.
  url = url.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    const p = extractParamName(String(expr || '').trim());
    return `:${p}`;
  });

  // Remove common cache-busters from query.
  url = url.replace(/([?&])_=:?\w+/g, '$1');
  url = url.replace(/([?&])bust=:?\w+/g, '$1');
  url = url.replace(/\?&/g, '?');
  url = url.replace(/[?&]$/, '');
  url = url.replace(/\?:\w+/g, '');
  url = url.replace(/&:\w+/g, '');

  // Normalize duplicate slash.
  url = url.replace('{BASE_URL}//', '{BASE_URL}/');
  url = url.replace(/:cacheBuster/g, '');
  url = url.replace(/quick-view:\w+/g, 'quick-view');

  // Fix query with dynamic "toString" blobs.
  url = url.replace(/\?\s*:?\w*toString\(\)/g, '');
  url = url.replace(/\?\$\{[^}]+\}/g, '');

  // Final validity.
  if (!/^\{BASE_URL\}\/[A-Za-z0-9]/.test(url)) return null;
  return url;
}

function inferAuth(url, method) {
  const pathPart = url.replace(/^\{BASE_URL\}/, '');
  const publicPrefixes = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-registration',
    '/auth/resend-verification',
    '/auth/reset-password',
    '/auth/verify-reset-code',
    '/auth/verify-otp',
    '/api/contact',
  ];
  if (publicPrefixes.some((p) => pathPart.startsWith(p))) return 'No';
  if (pathPart.startsWith('/world-ranking') && method === 'GET') return 'Optional';
  return 'Yes (Bearer token)';
}

function normalizeParamNames(list) {
  return unique(
    (list || []).map((x) => {
      if (!x) return x;
      if (x === 'id') return 'id';
      return String(x).replace(/[^A-Za-z0-9_]/g, '');
    })
  );
}

function normalizeBodyFields(list) {
  return unique(
    (list || []).map((x) => {
      const s = String(x || '').trim();
      if (!s) return s;
      return s.replace(/^\(dynamic\)\s*/i, 'dynamic: ');
    })
  );
}

function buildCleanSummary(rawSummary) {
  const map = new Map();
  for (const item of rawSummary || []) {
    const canonicalUrl = canonicalizeUrl(item.url);
    if (!canonicalUrl) continue;

    const key = `${item.method} ${canonicalUrl}`;
    const existing = map.get(key) || {
      method: item.method,
      url: canonicalUrl,
      auth: inferAuth(canonicalUrl, item.method),
      pathParams: [],
      queryParams: [],
      bodyFields: [],
      pages: [],
      sources: [],
    };

    existing.pathParams = unique([...existing.pathParams, ...normalizeParamNames(item.pathParams)]);
    existing.queryParams = unique([...existing.queryParams, ...normalizeParamNames(item.queryParams)]);
    existing.bodyFields = unique([...existing.bodyFields, ...normalizeBodyFields(item.bodyFields)]);
    existing.pages = unique([...existing.pages, ...(item.pages || [])]);
    existing.sources = unique([...existing.sources, ...(item.sources || [])]);
    map.set(key, existing);
  }

  const cleaned = [...map.values()].sort((a, b) => {
    if (a.url === b.url) return a.method.localeCompare(b.method);
    return a.url.localeCompare(b.url);
  });

  return cleaned;
}

function buildMarkdown(cleanSummary) {
  const lines = [];
  lines.push('# API Handover for App Developer');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Base URL');
  lines.push('');
  lines.push('- `BASE_URL = process.env.NEXT_PUBLIC_API_URL`');
  lines.push('- Local fallback in web code: `http://localhost:5000`');
  lines.push('- Production fallback in web code: `https://championfootballer-server.onrender.com`');
  lines.push('');
  lines.push('## Auth Format');
  lines.push('');
  lines.push('- Protected APIs: `Authorization: Bearer <token>`');
  lines.push('- Login/Register/Verification/Contact endpoints generally public.');
  lines.push('');
  lines.push('## API List');
  lines.push('');
  lines.push('| # | Method | Endpoint | Auth | Path Params | Query Params | Frontend Body Fields | Used On (Web) |');
  lines.push('|---|---|---|---|---|---|---|---|');

  cleanSummary.forEach((item, idx) => {
    lines.push(
      `| ${idx + 1} | ${item.method} | \`${escapePipe(item.url)}\` | ${escapePipe(item.auth)} | ${escapePipe(item.pathParams.join(', ') || '-')} | ${escapePipe(item.queryParams.join(', ') || '-')} | ${escapePipe(item.bodyFields.join(', ') || '-')} | ${escapePipe(item.pages.join(', ') || '-')} |`
    );
  });

  lines.push('');
  lines.push('## ID Passing Guide');
  lines.push('');
  lines.push('- `leagueId`: league-specific APIs (league details, matches, seasons, stats, trophy-room).');
  lines.push('- `matchId`: match details, votes, stats, availability, captain picks, prediction, edit/save.');
  lines.push('- `playerId`: player profile/stats/xp/trophies/history/teammates/achievements APIs.');
  lines.push('- `seasonId`: season archive/restore/status endpoints.');
  lines.push('- `userId` / `memberId`: member management, notifications, per-user operations.');
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- This list is generated from frontend usage (what web currently calls).');
  lines.push('- If backend has extra endpoints not used by web, they are not included here.');
  lines.push('');

  return lines.join('\n');
}

function escapePipe(value) {
  return String(value || '').replace(/\|/g, '\\|');
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing input file: ${path.relative(root, inputPath)}`);
  }

  const data = readJson(inputPath);
  const cleanSummary = buildCleanSummary(data.summary || []);
  const md = buildMarkdown(cleanSummary);
  fs.writeFileSync(outputMdPath, md, 'utf8');

  console.log(`Total clean endpoints: ${cleanSummary.length}`);
  console.log(`Wrote: ${path.relative(root, outputMdPath).replace(/\\/g, '/')}`);
}

main();

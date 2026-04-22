const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const OUT_DIR = path.join(PROJECT_ROOT, 'docs');
const OUT_JSON = path.join(OUT_DIR, 'api-inventory.json');
const OUT_MD = path.join(OUT_DIR, 'api-inventory.md');

const TARGET_CALLS = new Set([
  'fetch',
  'optimizedFetch',
  'quickFetch',
  'ultraFastFetch',
  'fetchAndCache',
  'apiCall',
  'fetchJSON',
]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      out.push(...walkFiles(full));
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    if (/\.d\.ts$/.test(entry.name)) continue;
    out.push(full);
  }
  return out;
}

function getRelative(file) {
  return path.relative(PROJECT_ROOT, file).replace(/\\/g, '/');
}

function getCalleeName(expression) {
  if (!expression) return null;
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  if (ts.isElementAccessExpression(expression) && ts.isIdentifier(expression.argumentExpression)) {
    return expression.argumentExpression.text;
  }
  return null;
}

function expressionToTemplateString(node, sourceFile) {
  if (!node) return null;

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) {
      out += '${' + span.expression.getText(sourceFile).trim() + '}';
      out += span.literal.text;
    }
    return out;
  }

  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = expressionToTemplateString(node.left, sourceFile);
    const right = expressionToTemplateString(node.right, sourceFile);
    if (left !== null && right !== null) return `${left}${right}`;
  }

  if (ts.isParenthesizedExpression(node)) {
    return expressionToTemplateString(node.expression, sourceFile);
  }

  return null;
}

function normalizeUrl(url) {
  if (!url) return null;
  let out = url.replace(/\s+/g, ' ').trim();
  out = out.replace(/`/g, '');

  // Replace common template placeholders for base URL first.
  out = out.replace(
    /\$\{(?:process\.env\.[A-Z0-9_]+|API_BASE_URL|getClientApiBaseUrl\(\))\}/g,
    '{BASE_URL}'
  );

  const baseTokens = [
    'process.env.NEXT_PUBLIC_API_URL',
    'process.env.API_URL',
    'process.env.BACKEND_URL',
    'API_BASE_URL',
    'getClientApiBaseUrl()',
  ];

  for (const token of baseTokens) {
    out = out.replace(new RegExp(escapeRegExp(token), 'g'), '{BASE_URL}');
  }

  out = out.replace(/\$\{\{BASE_URL\}\}/g, '{BASE_URL}');
  out = out.replace(/\{\{BASE_URL\}\}/g, '{BASE_URL}');

  out = out.replace(/https?:\/\/localhost:\d+/g, '{BASE_URL}');
  out = out.replace(/https?:\/\/championfootballer-server\.onrender\.com/g, '{BASE_URL}');

  if (out.startsWith('{BASE_URL}//')) out = out.replace('{BASE_URL}//', '{BASE_URL}/');
  if (out.startsWith('{BASE_URL}') && !out.startsWith('{BASE_URL}/')) {
    out = out.replace('{BASE_URL}', '{BASE_URL}/');
  }
  if (out.startsWith('/')) out = `{BASE_URL}${out}`;

  return out;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMethodFromOptions(optionsNode, sourceFile) {
  if (!optionsNode || !ts.isObjectLiteralExpression(optionsNode)) return 'GET';
  for (const prop of optionsNode.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = prop.name?.getText(sourceFile).replace(/['"]/g, '');
    if (name === 'method') {
      const value = expressionToTemplateString(prop.initializer, sourceFile) || prop.initializer.getText(sourceFile);
      return String(value || 'GET').replace(/['"`]/g, '').toUpperCase();
    }
  }
  return 'GET';
}

function getBodyFields(optionsNode, sourceFile) {
  if (!optionsNode || !ts.isObjectLiteralExpression(optionsNode)) return [];
  const fields = [];
  for (const prop of optionsNode.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = prop.name?.getText(sourceFile).replace(/['"]/g, '');
    if (name !== 'body') continue;

    const init = prop.initializer;
    if (ts.isCallExpression(init) && ts.isPropertyAccessExpression(init.expression)) {
      const owner = init.expression.expression.getText(sourceFile);
      const method = init.expression.name.getText(sourceFile);
      if (owner === 'JSON' && method === 'stringify' && init.arguments.length > 0) {
        const obj = init.arguments[0];
        if (ts.isObjectLiteralExpression(obj)) {
          for (const bodyProp of obj.properties) {
            if (ts.isPropertyAssignment(bodyProp) || ts.isShorthandPropertyAssignment(bodyProp)) {
              const key = bodyProp.name?.getText(sourceFile).replace(/['"]/g, '');
              if (key) fields.push(key);
            }
          }
          return unique(fields);
        }
      }
    }

    if (ts.isObjectLiteralExpression(init)) {
      for (const bodyProp of init.properties) {
        if (ts.isPropertyAssignment(bodyProp) || ts.isShorthandPropertyAssignment(bodyProp)) {
          const key = bodyProp.name?.getText(sourceFile).replace(/['"]/g, '');
          if (key) fields.push(key);
        }
      }
      return unique(fields);
    }

    const text = init.getText(sourceFile).trim();
    if (text) fields.push(`(dynamic) ${text}`);
  }
  return unique(fields);
}

function hasAuthHeader(optionsNode, sourceFile) {
  if (!optionsNode || !ts.isObjectLiteralExpression(optionsNode)) return false;
  for (const prop of optionsNode.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = prop.name?.getText(sourceFile).replace(/['"]/g, '');
    if (name !== 'headers') continue;
    const headerText = prop.initializer.getText(sourceFile);
    if (/Authorization|Bearer/.test(headerText)) return true;
  }
  return false;
}

function extractPathParams(url) {
  const params = [];
  const rx = /\$\{([^}]+)\}/g;
  const skipTokens = new Set([
    'API_BASE_URL',
    'apiBase',
    'apiUrl',
    'base',
    'baseUrl',
    'process',
    'Date',
    'Date.now',
    'now',
    'query',
    'params',
    'search',
    'qs',
  ]);

  let match;
  while ((match = rx.exec(url || '')) !== null) {
    let raw = match[1].trim();

    if (!raw) continue;
    if (/process\.env/i.test(raw)) continue;
    if (/toString\(\)\s*$/.test(raw)) continue;

    raw = raw
      .replace(/encodeURIComponent\(/g, '')
      .replace(/decodeURIComponent\(/g, '')
      .replace(/String\(/g, '')
      .replace(/Number\(/g, '')
      .replace(/[()]/g, '')
      .replace(/['"`]/g, '')
      .trim();

    if (!raw) continue;

    // For member paths like league.id or match.id, keep the most useful token.
    const part = raw.split('.').pop() || raw;
    const clean = part.split(/[^\w$]+/)[0].trim();
    if (!clean) continue;
    if (skipTokens.has(clean)) continue;

    params.push(clean);
  }
  return unique(params);
}

function extractQueryParams(url) {
  if (!url || !url.includes('?')) return [];
  const params = [];
  const query = url.split('?').slice(1).join('?');
  const rx = /(?:^|[&])([a-zA-Z0-9_]+)=/g;
  let match;
  while ((match = rx.exec(query)) !== null) params.push(match[1]);
  return unique(params);
}

function inferPage(fileRelative) {
  const p = fileRelative.replace(/\\/g, '/');
  if (p.startsWith('src/app/')) {
    const sub = p.slice('src/app/'.length);
    const parts = sub.split('/');
    const idx = parts.indexOf('_components');
    const used = idx >= 0 ? parts.slice(0, idx) : parts.slice(0, -1);
    const route = '/' + used.join('/');
    return route === '/' ? '/' : route;
  }
  if (p.startsWith('src/pages/')) {
    const sub = p.slice('src/pages/'.length).replace(/\.(tsx|ts|jsx|js)$/, '');
    return '/' + sub.replace(/\/index$/, '');
  }
  if (p.startsWith('src/Components/')) {
    const comp = p.slice('src/Components/'.length).replace(/\.(tsx|ts|jsx|js)$/, '');
    return `Shared Component: ${comp}`;
  }
  if (p.startsWith('src/lib/')) return 'Shared API Utility';
  return 'Unknown';
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function collectVariableDeclarations(sourceFile) {
  const map = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const key = node.name.text;
      const list = map.get(key) || [];
      list.push(node);
      map.set(key, list);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  for (const [k, list] of map) {
    list.sort((a, b) => a.pos - b.pos);
    map.set(k, list);
  }
  return map;
}

function resolveIdentifierInitializer(identifier, callPos, declarations, sourceFile) {
  const list = declarations.get(identifier);
  if (!list || list.length === 0) return null;
  let best = null;
  for (const decl of list) {
    if (decl.pos < callPos) best = decl;
    else break;
  }
  if (!best || !best.initializer) return null;

  const init = best.initializer;
  const fromExpr = expressionToTemplateString(init, sourceFile);
  if (fromExpr) return fromExpr;

  if (ts.isNewExpression(init) && ts.isIdentifier(init.expression) && init.expression.text === 'URL' && init.arguments?.[0]) {
    const val = expressionToTemplateString(init.arguments[0], sourceFile);
    if (val) return val;
  }

  return null;
}

function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const kind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : filePath.endsWith('.jsx')
      ? ts.ScriptKind.JSX
      : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, kind);
  const declarations = collectVariableDeclarations(sourceFile);
  const relative = getRelative(filePath);
  const page = inferPage(relative);
  const records = [];

  function pushRecord(node, record) {
    const lc = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    records.push({
      file: relative,
      line: lc.line + 1,
      page,
      ...record,
    });
  }

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const callee = getCalleeName(node.expression);
      if (callee && TARGET_CALLS.has(callee)) {
        const urlArg = node.arguments[0];
        const optionsArg = node.arguments[1];
        let urlText = expressionToTemplateString(urlArg, sourceFile);

        if (!urlText && urlArg && ts.isIdentifier(urlArg)) {
          urlText = resolveIdentifierInitializer(urlArg.text, node.pos, declarations, sourceFile);
        }

        const rawUrl = urlText || (urlArg ? urlArg.getText(sourceFile) : '(missing)');
        const normalizedUrl = normalizeUrl(rawUrl);

        pushRecord(node, {
          source: 'call',
          callee,
          method: getMethodFromOptions(optionsArg, sourceFile),
          urlRaw: rawUrl,
          url: normalizedUrl || rawUrl,
          pathParams: extractPathParams(rawUrl),
          queryParams: extractQueryParams(rawUrl),
          bodyFields: getBodyFields(optionsArg, sourceFile),
          authHeaderExplicit: hasAuthHeader(optionsArg, sourceFile),
        });
      }
    }

    if (ts.isObjectLiteralExpression(node)) {
      let urlProp = null;
      let methodProp = null;
      let bodyProp = null;
      for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const propName = prop.name?.getText(sourceFile).replace(/['"]/g, '');
        if (propName === 'url') urlProp = prop.initializer;
        if (propName === 'method') methodProp = prop.initializer;
        if (propName === 'body') bodyProp = prop.initializer;
      }
      if (urlProp) {
        const rawUrl = expressionToTemplateString(urlProp, sourceFile) || urlProp.getText(sourceFile);
        if (/(API_BASE_URL|NEXT_PUBLIC_API_URL|\/[a-zA-Z])/.test(rawUrl)) {
          const methodText = methodProp
            ? (expressionToTemplateString(methodProp, sourceFile) || methodProp.getText(sourceFile)).replace(/['"`]/g, '').toUpperCase()
            : 'GET';
          const bodyFields = [];
          if (bodyProp && ts.isObjectLiteralExpression(bodyProp)) {
            for (const p of bodyProp.properties) {
              if (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) {
                const k = p.name?.getText(sourceFile).replace(/['"]/g, '');
                if (k) bodyFields.push(k);
              }
            }
          } else if (bodyProp) {
            bodyFields.push(`(dynamic) ${bodyProp.getText(sourceFile)}`);
          }

          pushRecord(node, {
            source: 'url-candidate',
            callee: 'candidate',
            method: methodText,
            urlRaw: rawUrl,
            url: normalizeUrl(rawUrl) || rawUrl,
            pathParams: extractPathParams(rawUrl),
            queryParams: extractQueryParams(rawUrl),
            bodyFields: unique(bodyFields),
            authHeaderExplicit: false,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return records;
}

function cleanRecords(records) {
  return records
    .filter((r) => {
      const u = String(r.url || '');
      if (!u) return false;
      if (u.includes('+ endpoint')) return false;
      if (u.includes('||')) return false;
      if (/^\{BASE_URL\}\/\$\{[^}]+\}/.test(u)) return false;
      if (/localhost:3000/.test(u)) return false;
      if (/\.(png|jpg|jpeg|webp|svg|woff2?|ttf)(\?|$)/i.test(u)) return false;
      return /{BASE_URL}|\/[a-zA-Z]/.test(u);
    })
    .map((r) => ({
      ...r,
      url: r.url.replace(/\s+/g, ' ').trim(),
      pathParams: unique(r.pathParams || []),
      queryParams: unique(r.queryParams || []),
      bodyFields: unique(r.bodyFields || []),
    }));
}

function buildEndpointSummary(records) {
  const map = new Map();
  for (const r of records) {
    const key = `${r.method} ${r.url}`;
    const current = map.get(key) || {
      method: r.method,
      url: r.url,
      pathParams: [],
      queryParams: [],
      bodyFields: [],
      pages: [],
      sources: [],
      authHeaderExplicit: false,
      sourceTypes: [],
    };
    current.pathParams = unique([...current.pathParams, ...(r.pathParams || [])]);
    current.queryParams = unique([...current.queryParams, ...(r.queryParams || [])]);
    current.bodyFields = unique([...current.bodyFields, ...(r.bodyFields || [])]);
    current.pages = unique([...current.pages, r.page]);
    current.sources = unique([...current.sources, `${r.file}:${r.line}`]);
    current.sourceTypes = unique([...current.sourceTypes, r.source]);
    current.authHeaderExplicit = current.authHeaderExplicit || !!r.authHeaderExplicit;
    map.set(key, current);
  }

  return [...map.values()].sort((a, b) => {
    if (a.url === b.url) return a.method.localeCompare(b.method);
    return a.url.localeCompare(b.url);
  });
}

function buildMarkdown(summary, records) {
  const lines = [];
  lines.push('# API Inventory (Frontend)');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Base URL');
  lines.push('');
  lines.push('- Primary base: `process.env.NEXT_PUBLIC_API_URL`');
  lines.push('- Local fallback observed: `http://localhost:5000`');
  lines.push('- Production fallback observed in code: `https://championfootballer-server.onrender.com`');
  lines.push('');
  lines.push('## Endpoint Summary');
  lines.push('');
  lines.push('| # | Method | URL (Normalized) | Path Params | Query Params | Body Fields | Used In (Pages/Features) |');
  lines.push('|---|---|---|---|---|---|---|');

  summary.forEach((item, index) => {
    lines.push(
      `| ${index + 1} | ${item.method} | \`${escapePipe(item.url)}\` | ${escapePipe(item.pathParams.join(', ') || '-')} | ${escapePipe(item.queryParams.join(', ') || '-')} | ${escapePipe(item.bodyFields.join(', ') || '-')} | ${escapePipe(item.pages.join(', ') || '-')} |`
    );
  });

  lines.push('');
  lines.push('## Page-wise API Index');
  lines.push('');

  const pageMap = new Map();
  for (const item of summary) {
    for (const page of item.pages) {
      if (!pageMap.has(page)) pageMap.set(page, []);
      pageMap.get(page).push(item);
    }
  }

  const sortedPages = [...pageMap.keys()].sort((a, b) => a.localeCompare(b));
  for (const page of sortedPages) {
    lines.push(`### ${page}`);
    lines.push('');
    const items = pageMap.get(page) || [];
    for (const item of items) {
      lines.push(`- \`${item.method}\` \`${item.url}\``);
      lines.push(`  Path Params: ${item.pathParams.join(', ') || '-'}`);
      lines.push(`  Query Params: ${item.queryParams.join(', ') || '-'}`);
      lines.push(`  Body Fields: ${item.bodyFields.join(', ') || '-'}`);
    }
    lines.push('');
  }

  lines.push('');
  lines.push('## Source Mapping');
  lines.push('');
  summary.forEach((item, index) => {
    lines.push(`### ${index + 1}. ${item.method} ${item.url}`);
    lines.push('');
    lines.push(`- Path Params: ${item.pathParams.join(', ') || '-'}`);
    lines.push(`- Query Params: ${item.queryParams.join(', ') || '-'}`);
    lines.push(`- Body Fields: ${item.bodyFields.join(', ') || '-'}`);
    lines.push(`- Auth Header Explicit in Call: ${item.authHeaderExplicit ? 'Yes' : 'No / wrapper-managed'}`);
    lines.push(`- Pages/Features: ${item.pages.join(', ') || '-'}`);
    lines.push(`- Source Files: ${item.sources.map((s) => `\`${s}\``).join(', ')}`);
    lines.push('');
  });

  lines.push('## Raw Call Count');
  lines.push('');
  lines.push(`- Total call/candidate records scanned: ${records.length}`);
  lines.push(`- Total unique method+URL endpoints: ${summary.length}`);
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- `{BASE_URL}` means API base URL from environment or fallback.');
  lines.push('- `No / wrapper-managed` means authorization may still be attached by shared HTTP client/wrapper.');
  lines.push('- Dynamic URL variables that could not be statically resolved are included as best-effort expressions.');
  lines.push('');

  return lines.join('\n');
}

function escapePipe(value) {
  return String(value || '').replace(/\|/g, '\\|');
}

function main() {
  ensureDir(OUT_DIR);
  const files = walkFiles(SRC_DIR);
  let all = [];
  for (const file of files) {
    const recs = parseFile(file);
    all = all.concat(recs);
  }

  const cleaned = cleanRecords(all);
  const summary = buildEndpointSummary(cleaned);
  const md = buildMarkdown(summary, cleaned);

  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), records: cleaned, summary }, null, 2));
  fs.writeFileSync(OUT_MD, md, 'utf8');

  console.log(`Scanned files: ${files.length}`);
  console.log(`API call records: ${cleaned.length}`);
  console.log(`Unique endpoints: ${summary.length}`);
  console.log(`Wrote: ${getRelative(OUT_JSON)}`);
  console.log(`Wrote: ${getRelative(OUT_MD)}`);
}

main();

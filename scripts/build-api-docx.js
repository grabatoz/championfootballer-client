const fs = require('fs');
const path = require('path');

const root = process.cwd();
const inputArg = process.argv[2] || 'docs/api-inventory.md';
const outputArg = process.argv[3] || 'docs/API_Documentation.docx';
const mdPath = path.isAbsolute(inputArg) ? inputArg : path.join(root, inputArg);
const outDocxPath = path.isAbsolute(outputArg) ? outputArg : path.join(root, outputArg);
const outDir = path.dirname(outDocxPath);
const tmpDir = path.join(outDir, '.api-docx-tmp');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paragraph(text, opts = {}) {
  const safe = escapeXml(text);
  const boldOpen = opts.bold ? '<w:b/>' : '';
  const boldOpenCs = opts.bold ? '<w:bCs/>' : '';
  return `<w:p><w:r><w:rPr>${boldOpen}${boldOpenCs}</w:rPr><w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`;
}

function buildDocumentXml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const paragraphs = [];

  for (const line of lines) {
    if (line.trim() === '') {
      paragraphs.push('<w:p/>');
      continue;
    }

    if (line.startsWith('# ')) {
      paragraphs.push(paragraph(line.replace(/^#\s+/, ''), { bold: true }));
      continue;
    }

    if (line.startsWith('## ')) {
      paragraphs.push(paragraph(line.replace(/^##\s+/, ''), { bold: true }));
      continue;
    }

    if (line.startsWith('### ')) {
      paragraphs.push(paragraph(line.replace(/^###\s+/, ''), { bold: true }));
      continue;
    }

    paragraphs.push(paragraph(line));
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>
    ${paragraphs.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function main() {
  if (!fs.existsSync(mdPath)) {
    throw new Error(`Input markdown not found: ${mdPath}`);
  }

  const md = fs.readFileSync(mdPath, 'utf8');
  const docXml = buildDocumentXml(md);

  ensureDir(outDir);
  rmDir(tmpDir);
  ensureDir(tmpDir);
  ensureDir(path.join(tmpDir, '_rels'));
  ensureDir(path.join(tmpDir, 'word'));

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  fs.writeFileSync(path.join(tmpDir, '[Content_Types].xml'), contentTypesXml, 'utf8');
  fs.writeFileSync(path.join(tmpDir, '_rels', '.rels'), relsXml, 'utf8');
  fs.writeFileSync(path.join(tmpDir, 'word', 'document.xml'), docXml, 'utf8');

  // Package folder to zip, then rename to .docx
  const prevCwd = process.cwd();
  process.chdir(tmpDir);
  try {
    const zipPath = path.join(outDir, '__tmp_docx_build.zip');
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    if (fs.existsSync(outDocxPath)) fs.unlinkSync(outDocxPath);

    const { execSync } = require('child_process');
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path * -DestinationPath '${zipPath.replace(/\\/g, '\\\\')}' -Force"`, {
      stdio: 'ignore',
    });
    fs.renameSync(zipPath, outDocxPath);
  } finally {
    process.chdir(prevCwd);
    rmDir(tmpDir);
  }

  console.log(`Built DOCX: ${path.relative(root, outDocxPath).replace(/\\/g, '/')}`);
}

main();

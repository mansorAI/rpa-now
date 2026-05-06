const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function processFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  let chunks = [];

  if (ext === '.xlsx' || ext === '.xls') {
    chunks = processExcel(filePath, originalName);
  } else if (ext === '.csv') {
    chunks = processCSV(filePath, originalName);
  } else if (ext === '.pdf') {
    chunks = await processPDF(filePath, originalName);
  } else if (ext === '.txt' || ext === '.json') {
    chunks = processText(filePath, originalName);
  } else {
    throw new Error(`نوع الملف غير مدعوم: ${ext}`);
  }

  return chunks;
}

function processExcel(filePath, sourceName) {
  const workbook = XLSX.readFile(filePath);
  const chunks = [];

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    // Chunk: sheet summary
    chunks.push({
      chunk_text: `الشيت: ${sheetName} - يحتوي على ${rows.length} سطر بالأعمدة: ${headers.join(', ')}`,
      source_name: sourceName,
      source_type: 'excel',
      chunk_index: chunks.length,
      metadata: { sheet: sheetName, type: 'summary' },
    });

    // Chunk every row as readable text
    rows.forEach((row, i) => {
      const text = headers.map(h => `${h}: ${row[h]}`).join(' | ');
      if (text.trim().length > 5) {
        chunks.push({
          chunk_text: `[${sheetName}] ${text}`,
          source_name: sourceName,
          source_type: 'excel',
          chunk_index: chunks.length,
          metadata: { sheet: sheetName, row: i + 1 },
        });
      }
    });
  });

  return chunks;
}

function processCSV(filePath, sourceName) {
  const workbook = XLSX.readFile(filePath);
  return processExcel(filePath, sourceName).map(c => ({ ...c, source_type: 'csv' }));
}

async function processPDF(filePath, sourceName) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = data.text;

    // Split into ~500 char chunks
    const chunks = [];
    const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 20);

    paragraphs.forEach((para, i) => {
      if (para.length <= 800) {
        chunks.push({ chunk_text: para.trim(), source_name: sourceName, source_type: 'pdf', chunk_index: i, metadata: { page: i } });
      } else {
        const parts = para.match(/.{1,800}/g) || [];
        parts.forEach((p, j) => chunks.push({ chunk_text: p.trim(), source_name: sourceName, source_type: 'pdf', chunk_index: chunks.length, metadata: { page: i, part: j } }));
      }
    });

    return chunks;
  } catch {
    return [{ chunk_text: 'تعذر قراءة ملف PDF', source_name: sourceName, source_type: 'pdf', chunk_index: 0, metadata: {} }];
  }
}

function processText(filePath, sourceName) {
  const text = fs.readFileSync(filePath, 'utf8');
  const parts = text.match(/.{1,800}/gs) || [];
  return parts.map((p, i) => ({
    chunk_text: p.trim(),
    source_name: sourceName,
    source_type: 'text',
    chunk_index: i,
    metadata: {},
  }));
}

module.exports = { processFile };

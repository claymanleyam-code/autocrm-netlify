// Extract email addresses from an uploaded spreadsheet (xlsx/xls/csv) or PDF file.
// Both run entirely in the browser - files never leave the device except as email sends.
import * as XLSX from 'xlsx';
import { parseEmailList } from './emailListParser.js';

export async function extractEmailsFromSpreadsheet(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  let text = '';
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    text += XLSX.utils.sheet_to_csv(sheet) + '\n';
  }
  return parseEmailList(text);
}

export async function extractEmailsFromPdf(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(' ') + '\n';
  }
  return parseEmailList(text);
}

// Picks the right extractor based on file name/type.
export async function extractEmailsFromFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractEmailsFromPdf(file);
  }
  return extractEmailsFromSpreadsheet(file);
}

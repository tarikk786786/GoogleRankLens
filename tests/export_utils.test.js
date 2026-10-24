/**
 * Tests for CSV Export & Formula Injection Prevention
 */
const assert = require('assert');

function sanitizeCsvField(field) {
  if (!field) return '';
  const clean = String(field).trim();
  if (/^[=+@-]/i.test(clean)) {
    return `'${clean}`;
  }
  return clean;
}

function generateCSV(headers, rows) {
  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

function testCsvSanitization() {
  assert.strictEqual(sanitizeCsvField('=SUM(A1:A10)'), "'=SUM(A1:A10)", 'Formula = neutralized');
  assert.strictEqual(sanitizeCsvField('+cmd|/c calc'), "'+cmd|/c calc", 'Formula + neutralized');
  assert.strictEqual(sanitizeCsvField('-10% discount'), "'-10% discount", 'Formula - neutralized');
  assert.strictEqual(sanitizeCsvField('@SUM'), "'@SUM", 'Formula @ neutralized');
  assert.strictEqual(sanitizeCsvField('Normal Title'), 'Normal Title', 'Safe text preserved');

  console.log('✓ testCsvSanitization passed');
}

function testCsvEscaping() {
  const headers = ['Rank', 'Title'];
  const rows = [
    ['1', 'Quotes "Included" and, commas'],
    ['2', 'Simple Title']
  ];

  const csv = generateCSV(headers, rows);
  assert.ok(csv.includes('"Quotes ""Included"" and, commas"'), 'Quotes and commas escaped properly');
  assert.ok(csv.includes('"Rank","Title"'), 'Headers serialized');

  console.log('✓ testCsvEscaping passed');
}

module.exports = {
  run: () => {
    testCsvSanitization();
    testCsvEscaping();
  }
};

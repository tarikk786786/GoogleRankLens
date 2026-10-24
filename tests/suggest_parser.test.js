/**
 * Tests for Google Suggest API response processor
 */
const assert = require('assert');

function parseGoogleSuggestResponse(raw) {
  if (Array.isArray(raw) && Array.isArray(raw[1])) {
    return raw[1].slice(0, 8);
  }
  return [];
}

function testSuggestParsing() {
  const sampleResponse = [
    "seo tools",
    [
      "seo tools free",
      "seo tools google",
      "seo tools list",
      "seo tools for youtube",
      "seo tools definition",
      "seo tools extension",
      "seo tools ai",
      "seo tools open source",
      "seo tools premium"
    ],
    [],
    [],
    { "google:suggestsubtypes": [[], [], []] }
  ];

  const parsed = parseGoogleSuggestResponse(sampleResponse);
  assert.strictEqual(parsed.length, 8, 'Top 8 suggestions sliced');
  assert.strictEqual(parsed[0], 'seo tools free', 'First suggestion match');
  assert.strictEqual(parsed[1], 'seo tools google', 'Second suggestion match');

  const emptyParsed = parseGoogleSuggestResponse([]);
  assert.strictEqual(emptyParsed.length, 0, 'Empty response handled');

  const malformedParsed = parseGoogleSuggestResponse(null);
  assert.strictEqual(malformedParsed.length, 0, 'Null response handled');

  console.log('✓ testSuggestParsing passed');
}

module.exports = {
  run: () => {
    testSuggestParsing();
  }
};

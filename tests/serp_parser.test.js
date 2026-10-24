/**
 * Tests for SERP Parser & Result Stats Extractor
 */
const assert = require('assert');

function parseGoogleResultStats(statsText) {
  if (!statsText || typeof statsText !== 'string') {
    return { totalResultsFormatted: 'N/A', totalResultsNumber: 0, durationSeconds: '0.00' };
  }

  const numberMatch = statsText.match(/([\d\s,.]+)\s*(?:results|résultats|Ergebnisse|risultati|resultados|परिणाम)/i) 
    || statsText.match(/([\d\s,.]+)/);

  let totalResultsFormatted = 'N/A';
  let totalResultsNumber = 0;

  if (numberMatch && numberMatch[1]) {
    const rawNumStr = numberMatch[1].trim();
    const cleanedDigits = rawNumStr.replace(/[^\d]/g, '');
    if (cleanedDigits.length > 0) {
      totalResultsNumber = parseInt(cleanedDigits, 10);
      totalResultsFormatted = formatBigNumber(totalResultsNumber);
    }
  }

  const durationMatch = statsText.match(/\(([\d.,]+)\s*(?:seconds|s|secondes|Sekunden|segundos)/i);
  const durationSeconds = durationMatch ? durationMatch[1] : '0.40';

  return { totalResultsFormatted, totalResultsNumber, durationSeconds };
}

function formatBigNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + ' Billion';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + ' Million';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

function isTargetDomain(domain, targetDomains) {
  if (!targetDomains || !Array.isArray(targetDomains)) return false;
  const clean = domain.toLowerCase().replace(/^www\./, '');
  return targetDomains.some(target => {
    const t = target.trim().toLowerCase().replace(/^www\./, '');
    return t && (clean === t || clean.endsWith('.' + t));
  });
}

function testResultStatsParsing() {
  const english = parseGoogleResultStats("About 1,420,000,000 results (0.42 seconds)");
  assert.strictEqual(english.totalResultsNumber, 1420000000, 'English result count mismatch');
  assert.strictEqual(english.totalResultsFormatted, '1.42 Billion', 'English formatted mismatch');
  assert.strictEqual(english.durationSeconds, '0.42', 'English duration mismatch');

  const french = parseGoogleResultStats("Environ 35 200 000 résultats (0,38 secondes)");
  assert.strictEqual(french.totalResultsNumber, 35200000, 'French result count mismatch');
  assert.strictEqual(french.totalResultsFormatted, '35.2 Million', 'French formatted mismatch');

  const empty = parseGoogleResultStats("");
  assert.strictEqual(empty.totalResultsFormatted, 'N/A', 'Empty string handling');

  console.log('✓ testResultStatsParsing passed');
}

function testTargetDomainMatching() {
  const targets = ['dezo.in', 'tarikislam.in'];
  
  assert.strictEqual(isTargetDomain('dezo.in', targets), true, 'Exact match failed');
  assert.strictEqual(isTargetDomain('www.dezo.in', targets), true, 'www prefix match failed');
  assert.strictEqual(isTargetDomain('blog.dezo.in', targets), true, 'subdomain match failed');
  assert.strictEqual(isTargetDomain('tarikislam.in', targets), true, 'second target match failed');
  assert.strictEqual(isTargetDomain('otherdomain.com', targets), false, 'false positive check failed');
  assert.strictEqual(isTargetDomain('fake-dezo.in.attacker.com', targets), false, 'attacker subdomain bypass prevented');

  console.log('✓ testTargetDomainMatching passed');
}

module.exports = {
  run: () => {
    testResultStatsParsing();
    testTargetDomainMatching();
  }
};

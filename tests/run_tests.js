/**
 * GoogleRankLens — Master Test Runner
 * Author: tarikislam.in
 */

const serpParserTest = require('./serp_parser.test.js');
const suggestParserTest = require('./suggest_parser.test.js');
const exportUtilsTest = require('./export_utils.test.js');

console.log('====================================================');
console.log(' RUNNING GOOGLERANKLENS TEST SUITE');
console.log('====================================================');

let passed = 0;
let failed = 0;

function runSuite(name, fn) {
  try {
    console.log(`\n[Suite] ${name}`);
    fn();
    passed++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

runSuite('SERP Parser & Target Matcher', serpParserTest.run);
runSuite('Google Suggest Parser', suggestParserTest.run);
runSuite('CSV Export & Formula Protection', exportUtilsTest.run);

console.log('\n====================================================');
if (failed === 0) {
  console.log(`✓ ALL TEST SUITES PASSED (${passed}/${passed})`);
  console.log('====================================================');
  process.exit(0);
} else {
  console.error(`✗ TEST SUITES FAILED (${failed} failed, ${passed} passed)`);
  console.log('====================================================');
  process.exit(1);
}

# Testing Strategy — GoogleRankLens

## 1. Testing Goals
- Ensure 100% accurate extraction and numbering of organic SERP results (#1 to #N).
- Ensure resilient parsing of Google's `#result-stats` across diverse query types and locales.
- Verify Google Suggest API client parsing and error-handling without crashing.
- Verify Google Gemini AI JSON parsing and schema extraction.
- Validate CSV generation and data sanitization (prevent CSV formula injection).

## 2. Test Architecture & Structure
```
tests/
├── serp_parser.test.js       # Unit tests for SERP DOM extraction & rank assignment
├── suggest_parser.test.js    # Unit tests for Google Suggest API response handling
├── gemini_parser.test.js     # Unit tests for Gemini AI structured responses
├── export_utils.test.js      # Unit tests for CSV/JSON serialization & escaping
└── run_tests.js              # Standalone test runner (Node.js native test runner, zero extra npm deps)
```

## 3. Test Cases
### Suite 1: SERP Parser
- `test_extract_query`: Extracts query parameter `q` from varied Google URLs.
- `test_parse_result_stats`: Correctly parses "About 1,420,000,000 results (0.42 seconds)" and international equivalents ("Environ 1 420 000 000 résultats").
- `test_rank_assignment`: Correctly assigns sequential integers (#1, #2, #3...) to simulated organic Google result blocks.
- `test_ad_and_paa_filtering`: Ensures People Also Ask and Google Ads are not counted as organic ranks.

### Suite 2: Google Suggest Integration
- `test_parse_suggest_response`: Parses typical Google Suggest array output: `["keyword", ["keyword tool", "keyword research"]]`.
- `test_suggest_empty_response`: Gracefully handles empty or malformed suggestion arrays.

### Suite 3: CSV & Data Export
- `test_csv_escaping`: Properly escapes commas, quotes, and newlines.
- `test_csv_injection_prevention`: Sanitizes fields beginning with `=`, `+`, `-`, or `@` to prevent spreadsheet formula injection.

## 4. How to Run Tests
```bash
node tests/run_tests.js
```
The test suite executes directly in Node.js without requiring external heavyweight packages.

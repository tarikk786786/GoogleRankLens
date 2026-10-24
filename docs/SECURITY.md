# Security Guidelines — GoogleRankLens

## 1. Authentication & API Key Management
- **Local Storage Isolation**: Google Gemini API keys and Google Search Console tokens are stored exclusively inside the browser's encrypted `chrome.storage.local`.
- **Zero External Telemetry**: GoogleRankLens transmits API keys ONLY directly to Google's official endpoints:
  - `https://generativelanguage.googleapis.com/*`
  - `https://searchconsole.googleapis.com/*`
  No intermediate proxy servers, telemetry endpoints, or third-party analytical scripts are permitted.

## 2. Content Security Policy (CSP) & Manifest V3
- The extension runs strictly under Manifest V3 rules:
  - `script-src 'self'`: No `eval()`, no remote code injection, no inline scripts in HTML files.
  - All DOM insertions sanitize text using `textContent` or controlled DOM element construction (`document.createElement`).
  - No `innerHTML` interpolation of unsanitized external strings to eliminate Cross-Site Scripting (XSS).

## 3. Host Permissions & Scope
- Declarative host permissions are restricted to Google Search domains (`*://*.google.com/search*`, `*://*.google.co.in/search*`, etc.) and Google API endpoints.
- No general `*://*/*` host permissions.

## 4. Privacy & Personal Data
- Google search queries are processed locally and only used to request live suggestions or AI intelligence for the active tab.
- History logs remain strictly local on the client machine and can be cleared at any time via Extension Options.

## 5. Security Checklist
- [x] No hardcoded production secret keys in source files.
- [x] `chrome.storage.local` protected by browser sandbox boundaries.
- [x] Zero use of `eval` or `new Function`.
- [x] XSS-free DOM manipulation patterns across all UI scripts.
- [x] All upstream network requests enforce HTTPS exclusively.

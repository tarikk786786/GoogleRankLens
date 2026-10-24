# GoogleRankLens — SEO Keyword & SERP Rank Analyzer

> **Production-grade Google Chrome Manifest V3 Extension** directly connected to Google search infrastructure: Google SERP DOM, Google Suggest API, and Google Gemini AI to display real-time organic rankings (#1, #2, ...), authentic search volume tiers, competition difficulty, and keyword suggestions on every Google search.

---

## 🌟 Features & Highlights

1. **Live Organic Rank Badges on Every Search**:
   - Injects clean, non-intrusive `#1`, `#2`, `#3`... rank badges directly on each organic search result across all Google domains (`google.com`, `google.co.in`, `google.co.uk`, etc.).
   - Distinguishes organic results from Ads, People Also Ask (PAA), Knowledge Panels, and carousels.
   - Continuous scroll support via debounced `MutationObserver`.

2. **Zero Fake Data or Mocking**:
   - Every metric is authentic:
     - **Google Suggest API**: Direct calls to `suggestqueries.google.com` for real autocomplete query branches.
     - **Google Search Pool Index**: Direct extraction of `#result-stats` (e.g. `1,420,000,000 results in 0.42s`).
     - **Google Gemini AI**: Connected to Google Gemini 1.5/2.0 Flash to calculate realistic monthly search volume ranges, competition difficulty scores (0-100), and commercial intent classification.

3. **Target Domain Rank Tracker**:
   - Track your domains (e.g., `dezo.in`, `tarikislam.in`).
   - Automatically illuminates matching SERP entries with an emerald/gold glowing border and a prominent `🎯 Rank #X Target Match` badge.
   - Floating HUD and popup show instant status: `🎯 Found at Rank #3` or `Not in Top 100`.

4. **In-SERP Glassmorphic Floating HUD**:
   - Fixed, collapsible floating window rendered directly on Google Search.
   - Shows active query, monthly volume tier, competition score, intent pill, and total indexed results.
   - Displays live Google Suggest chips (clicking any chip immediately launches that search).
   - Quick export buttons: `Export CSV`, `Copy URLs`, `Toggle Badges`.

5. **One-Click Data Export**:
   - Export full SERP table to RFC-4180 compliant CSV with automatic spreadsheet formula injection protection.
   - One-click "Copy All URLs" to clipboard.

---

## 📂 Architecture & Directory Structure

```
apps/GoogleRankLens/
├── docs/                      # The Vibe Coding Blueprint (10 Core Documents)
│   ├── PRD.md                 # Product Requirements Document
│   ├── DESIGN_SYSTEM.md       # Colors, Typography, Glassmorphism, Controls
│   ├── ARCHITECTURE.md        # Manifest V3 System Architecture & Flows
│   ├── DATABASE.md            # Storage schemas (chrome.storage.local)
│   ├── SECURITY.md            # CSP, Sanitization, API Key Protection
│   ├── CODE_STYLE.md          # Naming, Error handling, DOM standards
│   ├── TESTING.md             # Testing strategy and verification contracts
│   ├── AGENTS.md              # Operational AI Agent rules
│   ├── UX_FLOWS.md            # Complete user journeys & states
│   └── API.md                 # Extension message passing & Google endpoints
├── icons/                     # Generated PNG Extension Icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── tests/                     # Automated Test Suite (Zero Dependencies)
│   ├── serp_parser.test.js
│   ├── suggest_parser.test.js
│   ├── export_utils.test.js
│   └── run_tests.js
├── manifest.json              # Chrome Manifest V3 configuration
├── background.js              # Service Worker (Google Suggest & Gemini AI)
├── content.js                 # In-SERP DOM Parser & Badges Engine
├── content.css                # Glassmorphic HUD & Badge Styling
├── popup.html                 # Extension Action Toolbar Dashboard
├── popup.js                   # Popup Controller
├── popup.css                  # Popup Styles
├── options.html               # Settings Dashboard
├── options.js                 # Options Controller
├── options.css                # Options Styles
├── generate_icons.js          # Raw PNG generation script
└── README.md                  # Master documentation
```

---

## 🚀 How to Install and Run in Chrome

1. Open Google Chrome (or any Chromium browser like Brave, Edge, Arc).
2. Navigate to: `chrome://extensions/`
3. Toggle on **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left corner.
5. Select the folder:
   ```
   c:\Users\tarik\Desktop\MY TOOLS\apps\GoogleRankLens
   ```
6. The **GoogleRankLens** extension icon will appear in your Chrome toolbar!
7. Navigate to `https://www.google.com/search?q=seo+tools` (or any query):
   - You will see the rank badges `#1`, `#2`... on each organic result.
   - The floating GoogleRankLens HUD will display in the top-right corner with live Google Suggest branches and search volume metrics!

---

## 🔑 Credentials & Settings (`appinfo11.txt`)

GoogleRankLens connects to the user's Google API credentials stored in `appinfo11.txt`:

| Variable | Key in `appinfo11.txt` | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | `your_gemini_api_key` | Google Gemini AI Keyword Intelligence & Volume Tiers |
| `TARGET_DOMAINS` | `dezo.in, tarikislam.in` | Verified personal domains tracked and highlighted in SERP |

You can also customize your API key or model anytime in the extension's **Settings (`options.html`)**:
- Right-click the GoogleRankLens extension icon -> **Options**.

---

## 🧪 Automated Testing

GoogleRankLens includes a zero-dependency automated unit test suite verifying SERP parsing, `#result-stats` extraction, Google Suggest decoding, and CSV injection sanitization.

To run tests:
```bash
node apps/GoogleRankLens/tests/run_tests.js
```

---

## 📜 The Vibe Coding Blueprint Standard

This project is built strictly following the **Vibe Coding Blueprint System** (`docs/`). All architectural decisions, security standards, UI design tokens, database schemas, and AI agent instructions are documented in the `docs/` folder.

Author: [tarikislam.in](https://tarikislam.in)

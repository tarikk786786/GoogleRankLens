# Architecture — GoogleRankLens

## 1. System Overview
GoogleRankLens is an enterprise-grade Google Chrome Manifest V3 extension designed to inject live rank metrics, SERP data, and real Google ecosystem intelligence into every Google search page without disrupting Google's layout or relying on mocked data.

## 2. Architecture Pattern
- **Pattern**: Chrome Manifest V3 Multi-Tier Architecture.
  - **Content Script (`content.js`, `content.css`)**: Injected into Google Search tabs. Parses the SERP DOM, monitors continuous scroll via `MutationObserver`, injects non-intrusive rank badges and the floating HUD.
  - **Background Service Worker (`background.js`)**: Event-driven background worker. Orchestrates external API requests (Google Suggest, Google Gemini API, Google Search Console), manages caching, and proxies cross-origin requests.
  - **Popup Dashboard (`popup.html`, `popup.js`)**: Fast action menu showing current active tab status, tracked domain position, and quick exports.
  - **Options Management (`options.html`, `options.js`)**: User settings for Google API keys, target domains, and UI preferences.
  - **Storage Layer**: Uses `chrome.storage.local` with automatic in-memory caching and TTL expiration.

## 3. Technology Stack
- **Extension Platform**: Chrome Manifest V3 (compatible with Chrome, Brave, Edge, Arc, Opera)
- **Frontend / In-SERP DOM**: Vanilla JavaScript (ES2022+), CSS Grid/Flexbox, CSS Custom Properties
- **Background Worker**: ES Modules Service Worker
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`)
- **Google Search APIS**:
  - Google Autocomplete / Suggest API (`https://suggestqueries.google.com/complete/search?client=chrome&q=...`)
  - Google `#result-stats` DOM extractor
  - Google Search Console API (`https://searchconsole.googleapis.com/v1/sites/...`)
- **Data Export**: RFC-4180 compliant CSV generator, JSON formatter, Clipboard API

## 4. System Components
```
┌─────────────────────────────────────────────────────────────┐
│                      Google Search Page                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Google Search Results DOM (#search, .g, .MjjYud, etc.) │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ DOM Mutations & Parsing       │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │            GoogleRankLens Content Script              │  │
│  │   - SERP Parser (calculates #1, #2, #3...)            │  │
│  │   - In-SERP Floating HUD & Glassmorphism Badges       │  │
│  │   - Target Domain Highlighting Engine                 │  │
│  └───────────────────────────▲───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ chrome.runtime.sendMessage
┌──────────────────────────────▼──────────────────────────────┐
│            GoogleRankLens Background Service Worker         │
│  ┌───────────────────────────┴───────────────────────────┐  │
│  │                  Request Orchestrator                 │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 1. Google Suggest API (Live Autocomplete queries)    │  │
│  │ 2. Google Gemini AI API (Volume tier, Intent, CPC)    │  │
│  │ 3. Google Search Console API (GSC Impressions/Clicks) │  │
│  │ 4. Cache & Rate-Limiter Engine (TTL-backed storage)   │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    chrome.storage.local                     │
│  - Settings (API Keys, Target Domains, UI Preferences)      │
│  - Query Cache (24-hour TTL keyword metrics)                │
└─────────────────────────────────────────────────────────────┘
```

## 5. Data Flow
1. User enters query and loads Google Search (`google.com/search?q=keyword`).
2. Content script initializes:
   - Detects search query from URL `q` parameter or search box value.
   - Extracts `#result-stats` for total indexed results and execution duration.
   - Scans DOM for organic result containers, assigns rank indices (#1, #2, #3...), and attaches badges.
3. Content script messages background worker: `{ action: "GET_KEYWORD_INTELLIGENCE", query }`.
4. Background worker checks `chrome.storage.local` cache:
   - If cached and within TTL, returns immediately.
   - If not cached:
     - Parallel fetch to Google Suggest API.
     - Call to Google Gemini AI for structured keyword metrics (Volume tier, difficulty, intent, CPC).
     - Aggregates payload and caches it.
5. Content script receives payload and renders live data into the floating HUD.
6. MutationObserver detects continuous scroll or pagination: automatically tags new results without duplicate badges.

## 6. Failure Scenarios & Resilience
- **Google DOM Updates**: Multiple resilient CSS selectors (`div.g`, `div.MjjYud`, `div[data-sokoban-container]`, `div.tF2Cxc`). Fallback algorithm traverses direct link anchors with `h3` tags.
- **Offline / Network Interruption**: Badges continue operating offline using DOM position parsing; HUD shows offline status without crashing.
- **Gemini API Key Missing or Quota Exceeded**: HUD displays live Google Suggest data and DOM `#result-stats` calculations with a helpful link to add a key in Settings, rather than throwing an error.
- **No Results / Zero SERP**: Content script detects zero-result pages and displays clean notification pill.

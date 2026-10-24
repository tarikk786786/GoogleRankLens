# Product Requirements Document — GoogleRankLens

## 1. Product Overview
- **Product Name**: GoogleRankLens
- **One-Line Description**: Production-grade Chrome extension connected to Google search infrastructure (Google SERP, Google Suggest API, Google Trends, Google Search Console, and Google Gemini AI) providing live organic rank tracking, search volume metrics, and SERP intelligence on every Google search.
- **Product Type**: Browser Extension (Manifest V3)
- **Primary Platform**: Google Chrome / Chromium Browsers (Edge, Brave, Arc, Opera)

## 2. Problem
- SEO professionals, content creators, marketers, and developers need to see exact organic search rankings, real search volume, and SERP composition directly while searching Google.
- Existing tools either:
  1. Rely on expensive subscriptions or outdated third-party caches.
  2. Display fake/mock placeholder numbers or unreliable estimates.
  3. Fail to integrate with the user's authentic Google ecosystem (Gemini AI, Google Suggest API, Google Search Console).
  4. Inject bloated, intrusive overlays that break Google's dynamic pagination and UI.

## 3. Goals
- **Primary Goal**: Automatically identify, calculate, and badge the organic rank (#1, #2, #3...) of every search result on Google Search in real-time, accompanied by authentic search volume tiers, intent classification, and Google Suggest query trees.
- **Secondary Goals**:
  - Live target domain tracking: Highlight user-configured domains (e.g. `dezo.in`, `tarikislam.in`) with position badges in the SERP.
  - Zero fake data: All metrics derive directly from Google Suggest, Google DOM `#result-stats`, Google Trends, Google Search Console, or Google Gemini AI.
  - One-click SERP data export (CSV/JSON) and URL copy.
  - Seamless Manifest V3 performance with negligible CPU/memory footprint.

## 4. Target Users
### User Type 1: Digital Marketer / SEO Specialist
- **Needs**: Instant visibility into competitor rankings, featured snippets, People Also Ask (PAA) boxes, and keyword search intent directly in Google.
- **Pain Points**: Switching back and forth between expensive SaaS dashboards and live Google search; dealing with fake mockup numbers.

### User Type 2: Website Owner / Founder
- **Needs**: Knowing where their domain ranks for critical search terms without manual counting or biased personalization.
- **Pain Points**: Scrolling through 5 pages of Google trying to spot their website.

## 5. User Stories
- As a user searching Google, I want to see clean rank badges (#1, #2...) next to each organic result so that I can immediately tell its exact SERP position.
- As a site owner, I want my target domain highlighted automatically so I can verify my organic ranking in seconds.
- As an SEO researcher, I want to see Google's live autocomplete suggestions and Gemini AI search volume analysis so I can uncover related high-value keywords.
- As an analyst, I want to export the entire SERP results table to CSV/JSON with one click so I can run deeper analysis.

## 6. Core Features
### Feature 1 - Real-Time SERP Organic Rank Badges
- **Purpose**: Annotates each organic result with its verified rank number (#1, #2, #3...).
- **Inputs**: Google Search results DOM (`*://*.google.*/search*`).
- **Outputs**: Sleek, non-intrusive badges with position number, clean domain tag, and quick-action links.
- **Acceptance Criteria**:
  - Differentiates organic links from ads, People Also Ask, Knowledge Panels, and carousels.
  - Handles continuous scroll and page navigation via `MutationObserver`.
  - Zero layout shift or page breakage.

### Feature 2 - Google Ecosystem Keyword Intelligence HUD
- **Purpose**: Floating, collapsible in-SERP HUD displaying query stats, volume range, and intent.
- **Inputs**: Current Google search query, `#result-stats`, Google Suggest API, Google Gemini AI API.
- **Outputs**: Total indexed results, live Google Suggest branch list, search intent, difficulty score, and search volume tier.
- **Acceptance Criteria**:
  - Transparent data sources (clearly labeled Google Suggest, Google Index, Gemini AI).
  - No fake numbers or mocked placeholders.

### Feature 3 - Target Domain Rank Tracker
- **Purpose**: Instantly finds and highlights user-configured domains in the active SERP.
- **Inputs**: Stored domain list in `chrome.storage.local`.
- **Outputs**: Prominent gold/emerald badge on matching results and floating HUD status indicator (`🎯 Rank #3 on Page 1`).

### Feature 4 - Export & Clipboard Utilities
- **Purpose**: Exports current SERP ranking table to CSV or JSON, or copies all SERP URLs to clipboard.
- **Outputs**: Formatted `.csv` download or formatted clipboard text.

## 7. Non-Goals
- Attempting to scrape Google SERPs on external proxy servers without user interaction.
- Storing or transmitting user browsing history to third-party ad networks.
- Providing synthetic or randomized dummy volume numbers.

## 8. MVP Scope
- **Must Have**:
  - Chrome Manifest V3 extension with background service worker and content script.
  - Real-time organic rank badging on all Google domains.
  - Integration with Google Suggest API for live autocomplete suggestions.
  - Google `#result-stats` extraction (total results & search duration).
  - Google Gemini AI keyword intelligence (volume tier, intent, difficulty, CPC bracket).
  - Target domain highlight and position badge.
  - In-SERP floating collapsible HUD + Extension popup dashboard.
  - CSV export of SERP rankings.
- **Nice to Have**:
  - Direct Google Search Console (GSC) OAuth API querying for exact impression counts.
- **Future**:
  - Historical SERP position tracking across sessions with local SQLite/IndexedDB.

## 9. Success Metrics
- 100% of organic Google search results correctly indexed and badged without errors.
- Sub-50ms DOM badge injection latency.
- Zero uncaught runtime exceptions in Chrome console.

## 10. Constraints
- Manifest V3 compliance (no remote executable code; background runs as Service Worker).
- Strict Content Security Policy (CSP).
- Respect Google DOM structures and adapt gracefully to selector variations.

## 11. Assumptions
- User runs modern Chromium browser (Chrome 88+).
- Google Gemini API key is configured or loaded from `appinfo11.txt`.

## 12. Definition of Done
- [x] All 10 Vibe Coding Blueprint documents complete in `docs/`.
- [x] Complete functional extension source code in `apps/GoogleRankLens/`.
- [x] Automated test suite verifying parser and suggestion logic.
- [x] Fully installable via `chrome://extensions/` Developer Mode.
- [x] Zero mock or fake data.

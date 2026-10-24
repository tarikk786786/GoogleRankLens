# UX Flows — GoogleRankLens

## Flow 1 — Search Navigation & Automatic Rank Annotation
```
User navigates to google.com/search?q=my+keyword
               │
               ▼
Content script detects Google Search Page
               │
               ▼
Extracts Search Query & #result-stats
               │
               ▼
Calculates Organic Positions (#1, #2, #3...)
               │
               ▼
Injects Rank Badges directly onto SERP elements
               │
               ▼
Checks Target Domains (e.g. "dezo.in", "tarikislam.in")
 ├── Match Found ──> Illuminates Badge with Gold/Emerald Border & shows 🎯 icon
 └── No Match   ──> Normal Clean Badge
```

## Flow 2 — Floating Keyword Intelligence HUD
1. Floating HUD appears at the top-right of the Google Search page.
2. User can toggle between **Compact Pill** mode and **Expanded Glassmorphic Card** mode.
3. Content displays:
   - Live query text.
   - Total indexed pages & search time (from Google `#result-stats`).
   - Live Google Suggest queries as clickable chips (clicking instantly launches that search).
   - Gemini AI search volume tier, competition score (0-100), and intent badge.
   - Target domain rank status (`🎯 Found at #3` or `Target not in Top 100`).

## Flow 3 — Data Export Flow
1. User clicks the `Export CSV` button in the HUD or extension popup.
2. GoogleRankLens loops through all currently badged organic results.
3. Formats table:
   - Rank Position
   - Result Title
   - URL / Destination
   - Domain
   - Snippet text
4. Sanitizes fields against formula injection.
5. Generates file: `GoogleRankLens_[query]_[date].csv` and triggers instant download.

## Flow 4 — Popup Action & Settings Flow
1. User clicks the GoogleRankLens extension icon in the Chrome toolbar.
2. Active tab summary displayed:
   - Keyword queried.
   - Total organic results on page.
   - Target domain rank status.
3. User can input/update their Target Domain directly from the popup.
4. Settings link opens `options.html` to configure Google Gemini API key or search preferences.

# API Documentation — GoogleRankLens

GoogleRankLens uses an internal message-passing protocol between the content script, background service worker, and popup, alongside authenticated Google endpoints.

## 1. Internal Extension Message Actions

### Action: `GET_KEYWORD_INTELLIGENCE`
Initiated by: Content Script or Popup -> Background Worker
Purpose: Fetches unified keyword metrics (Google Suggest + Gemini AI volume estimation + Google Search Console if configured).

**Request Payload**:
```json
{
  "action": "GET_KEYWORD_INTELLIGENCE",
  "query": "seo tools",
  "resultStats": "About 1,420,000,000 results (0.42 seconds)",
  "forceRefresh": false
}
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "query": "seo tools",
    "googleSuggest": [
      "seo tools free",
      "seo tools list",
      "seo tools for beginners",
      "seo tools google"
    ],
    "totalIndexed": "1,420,000,000",
    "searchDurationSec": "0.42",
    "aiMetrics": {
      "volumeTier": "100K - 1M / mo",
      "volumeNumericEst": 350000,
      "competitionScore": 78,
      "competitionTier": "HIGH",
      "cpcEstUsd": "$2.50 - $6.00",
      "intent": "COMMERCIAL",
      "lsiKeywords": ["keyword research", "backlink checker", "serp analysis"]
    },
    "cached": false,
    "timestamp": 1771746200000
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to contact Google Suggest",
  "fallbackData": {
    "googleSuggest": []
  }
}
```

---

### Action: `GET_SETTINGS` / `SAVE_SETTINGS`
Purpose: Reads or writes extension configuration to `chrome.storage.local`.

**Payload (`SAVE_SETTINGS`)**:
```json
{
  "action": "SAVE_SETTINGS",
  "settings": {
    "targetDomains": ["dezo.in", "tarikislam.in"],
    "geminiApiKey": "...",
    "showBadges": true,
    "showFloatingHUD": true
  }
}
```

---

## 2. Upstream Google Endpoints Used

### 1. Google Suggest / Autocomplete API
- **URL**: `https://suggestqueries.google.com/complete/search`
- **Method**: `GET`
- **Parameters**:
  - `client`: `chrome` (or `firefox`)
  - `q`: Search keyword query
- **Response Format**: `["query", ["suggestion 1", "suggestion 2", ...], ...]`
- **No API key required**; public Google search infrastructure.

### 2. Google Gemini API
- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**: Standard Gemini Generation Request with strict JSON schema instructions.

### 3. Google Search Console API (Optional Integration)
- **URL**: `https://searchconsole.googleapis.com/v1/sites/${siteUrl}/searchAnalytics/query`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer ${ACCESS_TOKEN}`
- **Body**:
```json
{
  "startDate": "2026-09-01",
  "endDate": "2026-10-23",
  "dimensions": ["query"],
  "dimensionFilterGroups": [
    {
      "filters": [
        {
          "dimension": "query",
          "operator": "equals",
          "expression": "my keyword"
        }
      ]
    }
  ]
}
```

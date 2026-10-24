# Database & Storage Model — GoogleRankLens

## 1. Storage Engine
- **Engine**: `chrome.storage.local`
- **Scope**: Local to the user's browser profile (isolated, persistent, fast, no external database dependencies required).

## 2. Naming Conventions
- Storage keys follow prefix naming: `grl_setting_*`, `grl_cache_*`, `grl_history_*`.
- Dates and timestamps are stored in ISO 8601 UTC strings (`new Date().toISOString()`).

## 3. Storage Schemas

### Settings Schema (`grl_settings`)
```typescript
interface GRLSettings {
  geminiApiKey: string;          // Google Gemini API Key
  targetDomains: string[];       // Domains to highlight in SERP (e.g. ["dezo.in", "tarikislam.in"])
  highlightTarget: boolean;      // Toggle target highlight on/off
  showBadges: boolean;           // Show/hide rank badges
  showFloatingHUD: boolean;      // Show/hide floating HUD
  autoExportCsv: boolean;        // Automatically prompt export on demand
  geminiModel: string;           // "gemini-1.5-flash" or "gemini-2.0-flash"
  gscSiteUrl?: string;           // Google Search Console verified property URL
  gscAccessToken?: string;       // GSC OAuth token
  theme: "auto" | "dark" | "light";
}
```

### Keyword Intelligence Cache Schema (`grl_cache_[hash]`)
```typescript
interface GRLKeywordData {
  query: string;
  timestamp: number;             // Timestamp in ms
  ttl: number;                   // Expiry (default 24 hours: 86,400,000 ms)
  googleSuggest: string[];       // Real array of suggestions from Google Suggest API
  totalIndexedResults?: string;  // e.g. "1,420,000,000"
  searchTimeSec?: string;        // e.g. "0.45"
  aiMetrics?: {
    volumeTier: string;          // "10K - 100K / mo"
    volumeNumericEst: number;    // 50000
    competitionScore: number;    // 0 - 100
    competitionTier: "LOW" | "MEDIUM" | "HIGH";
    cpcEstUsd: string;           // "$1.20 - $2.50"
    intent: "INFORMATIONAL" | "COMMERCIAL" | "TRANSACTIONAL" | "NAVIGATIONAL";
    lsiKeywords: string[];
  };
  gscMetrics?: {
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
  };
}
```

### Search History Schema (`grl_search_history`)
```typescript
interface GRLHistoryEntry {
  id: string;                    // UUID or timestamp
  query: string;
  date: string;                  // ISO Date
  targetRank: number | null;     // Position found (e.g. 3, or null if >100)
  totalResultsCount: number;
}
```

## 4. Cache Eviction & Cleanup Rules
- Items older than 24 hours (`Date.now() - timestamp > ttl`) are pruned during idle checks.
- Maximum cache entries limited to 200 items to prevent storage bloat.

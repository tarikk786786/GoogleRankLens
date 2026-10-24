# Code Style & Conventions — GoogleRankLens

## 1. General Principles
- **Clarity over cleverness**: Write explicit, readable JavaScript (ES2022+ standards).
- **Resilience**: The Google SERP DOM changes frequently; always provide defensive guards and fallback selectors.
- **Zero DOM Pollution**: Scope all extension DOM elements and CSS classes under the `grl-` namespace (e.g. `.grl-rank-badge`, `.grl-hud-container`) to avoid collisions with Google's native styles.
- **Single Responsibility**: Separate DOM parsing, background networking, and UI rendering.

## 2. Naming Conventions
- CSS Classes & IDs: `grl-[block]__[element]--[modifier]` or `grl-[component]-[element]` (e.g. `grl-rank-badge`, `grl-hud-metric`)
- JavaScript Functions: camelCase (e.g. `parseSerpResults()`, `fetchGoogleSuggest()`)
- Constants & Actions: UPPER_SNAKE_CASE (e.g. `ACTION_GET_INTELLIGENCE`, `DEFAULT_CACHE_TTL`)
- Files: kebab-case or standard extension naming (`content.js`, `background.js`, `popup.js`)

## 3. Error Handling Pattern
- Always wrap external API requests in `try...catch` blocks.
- Never let an API failure crash the Google Search page or prevent rank badges from appearing.
- Always provide descriptive fallback states in the UI.

```javascript
try {
  const result = await fetchGoogleData(query);
  renderData(result);
} catch (error) {
  console.warn('[GoogleRankLens] Failed to retrieve data:', error);
  renderFallbackState(error.message);
}
```

## 4. DOM Manipulation Rules
- Prefer `document.createElement()` and `element.textContent` over string concatenation with `innerHTML`.
- For SVG icons, construct elements using `document.createElementNS('http://www.w3.org/2000/svg', ...)` or sanitized templates.
- Mark injected elements with `data-grl-injected="true"` so subsequent `MutationObserver` passes never double-process or re-badge an existing node.

## 5. Do's and Don'ts
- **DO**: Debounce `MutationObserver` callbacks so rapid page mutations don't cause high CPU utilization.
- **DO**: Validate all inputs before saving to `chrome.storage.local`.
- **DON'T**: Inject inline `<style>` tags directly inside Google elements; keep all styles in `content.css`.
- **DON'T**: Invent mock/fake metrics; if data cannot be fetched, display a clear status indicator.

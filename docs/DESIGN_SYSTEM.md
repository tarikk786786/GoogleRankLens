# Design System — GoogleRankLens

This defines the visual language, typography, color system, and UI controls for the in-SERP HUD overlay, organic rank badges, extension popup, and options page.

## 1. Design Direction
- **Style**: Ultra-clean, modern technical HUD with glassmorphism accents and native Google integration feel.
- **Mood**: Authoritative, fast, restrained, developer-grade precision (no cluttered advertising or visual noise).
- **Design Principles**:
  - Non-intrusive: Enhances Google's native SERP layout without shifting or distorting search results.
  - Transparent: Every metric shows its verified data source (Google Index, Google Suggest, Gemini AI).
  - High Contrast & Legibility: Crystal clear against both Google Light Mode and Google Dark Mode.

## 2. Brand
- **Brand Name**: GoogleRankLens
- **Brand Mark**: `[ ⌕ RankLens ]`
- **Brand Voice**: Analytical, objective, precise, performant.

## 3. Color Palette
```css
/* Core Palette */
--grl-bg: #0f172a;               /* Slate 900 */
--grl-surface: #1e293b;          /* Slate 800 */
--grl-surface-glass: rgba(30, 41, 59, 0.92);
--grl-border: #334155;           /* Slate 700 */
--grl-border-focus: #3b82f6;     /* Blue 500 */

/* Typography */
--grl-text-primary: #f8fafc;     /* Slate 50 */
--grl-text-secondary: #94a3b8;   /* Slate 400 */
--grl-text-muted: #64748b;       /* Slate 500 */

/* Semantic Accents */
--grl-primary: #3b82f6;          /* Google Electric Blue */
--grl-primary-hover: #2563eb;
--grl-success: #10b981;          /* Emerald Green (Target Match / High Rank) */
--grl-success-bg: rgba(16, 185, 129, 0.15);
--grl-warning: #f59e0b;          /* Amber (Medium Competition) */
--grl-danger: #ef4444;           /* Red (High Difficulty) */
--grl-accent-purple: #8b5cf6;    /* Gemini AI Intelligence Pill */
```

## 4. Typography
- **Font Stack**: System UI, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `Helvetica`, `Arial`, sans-serif.
- **Monospace Stack**: `"JetBrains Mono"`, `"Fira Code"`, `ui-monospace`, `Consolas`, monospace.
- **Scale**:
  - Badge Rank Number: `11px` / `700` weight / Monospace.
  - HUD Title & Metrics: `14px` / `600` weight.
  - Meta Labels: `11px` / `500` weight / Uppercase tracking.
  - Body Text: `13px` / `400` weight.

## 5. Spacing Scale
- `base: 4px`
- `2xs: 2px` | `xs: 4px` | `sm: 8px` | `md: 12px` | `lg: 16px` | `xl: 20px` | `2xl: 24px`

## 6. Border Radius
- `Badge Pill`: `6px`
- `Card / Container`: `10px`
- `HUD Window`: `12px`
- `Button`: `8px`

## 7. Shadows & Glassmorphism
```css
--grl-glass-blur: blur(12px);
--grl-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--grl-shadow-hud: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
```

## 8. Interactive Controls
### Rank Badges
- Displayed beside or directly above the Google search result headline.
- Features: `# Rank Number`, `Domain Tag`, and `Copy URL` icon.
- Hover effect: Subtle lift and contrast boost.
- Target Match: Special glowing emerald border with target icon.

### In-SERP Floating HUD
- Located at top right of search view (collapsible to a compact floating pill).
- Contains:
  1. Header with Query & Search Result Pool count.
  2. Metrics Grid: Monthly Volume Tier, Intent Tag, Difficulty Score, CPC.
  3. Google Suggest Live Tags: Clickable chips to trigger related search.
  4. Quick Actions: `Export CSV`, `Copy URLs`, `Toggle Badges`, `Settings`.

## 9. Accessibility
- All text meets WCAG AA contrast (minimum 4.5:1 ratio).
- Keyboard accessible (`Esc` closes modals, `Tab` focuses controls).
- Clean `aria-label` attributes on icon-only buttons.

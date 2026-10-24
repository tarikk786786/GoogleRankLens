# AI Coding Agent Instructions — GoogleRankLens

Turn project documentation into operational instructions. Any AI agent or developer touching this codebase must adhere strictly to these principles.

## 1. Project Context
- **Project**: GoogleRankLens
- **Purpose**: Manifest V3 Chrome Extension providing real-time organic SERP rank tracking, Google Suggest integration, and Gemini AI keyword volume intelligence on Google Search.
- **Primary Users**: SEOs, website owners, founders, digital marketers.

## 2. Sources of Truth
Before modifying this project, inspect the following documents in `/docs`:
- `PRD.md`: Defines product scope, features, and acceptance criteria.
- `DESIGN_SYSTEM.md`: Defines UI styles, classes, colors, and badge patterns.
- `ARCHITECTURE.md`: Defines component interaction and MV3 message flows.
- `SECURITY.md`: Defines CSP, secret storage, and DOM sanitization rules.
- `TESTING.md`: Defines test contracts and verification procedures.

## 3. General Rules
- Understand existing DOM traversal logic before modifying selectors.
- Always use the `grl-` CSS namespace for injected styles and classes.
- NEVER fabricate, hardcode, or mock search volume numbers. If an API is unreachable, report status objectively.
- Maintain Manifest V3 compliance (no `eval`, no external script injection, no inline scripts in HTML).
- Keep all extension assets self-contained within `apps/GoogleRankLens/`.

## 4. Planning & Modification Protocol
Before altering code:
1. Identify the affected tier (Content Script, Background Worker, Popup, or Options).
2. Verify impact on Google's search layout.
3. Check `appinfo11.txt` for relevant API configurations.
4. Execute `node tests/run_tests.js` to ensure zero regressions.

## 5. Definition of Done
A task is only complete when:
- Requirements are met.
- Unit tests in `tests/run_tests.js` pass with 0 errors.
- Code follows `docs/CODE_STYLE.md`.
- No console errors are emitted on Google search pages.

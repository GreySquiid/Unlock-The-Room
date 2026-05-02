# Phase 3 Handoff — Dashboard Refinements & Seam Fixes

## What shipped

### 3.1 — Kebab menu (Levels.js)
- Replaced the 4 per-row action buttons (Edit Layout / Publish-Unpublish / Validate-Invalidate / Delete) with a single `⋯` trigger.
- Dropdown uses `position: fixed` + `getBoundingClientRect()` to escape the table's `overflow: hidden`.
- Full keyboard accessibility: Esc closes, arrow keys navigate items, `Enter`/`Space` activates, focus returns to trigger on close.
- ARIA: `role="menu"`, `role="menuitem"`, `aria-haspopup="menu"`, `aria-expanded`, `aria-label` on trigger.
- All 4 action groups present: Edit Layout, Publish/Unpublish, Validate/Invalidate, Delete.
- Clicking outside closes the open menu via a document `mousedown` listener (cleaned up on unmount).

### 3.2 — Reports bar chart (Reports.js)
- Recharts `BarChart` inserted between the KPI strip and the data table.
- Three bars: Easy / Medium / Hard — colors match the badge tokens (`--color-success`, `--color-warning`, `--color-danger`).
- Colors resolved at component init via `getComputedStyle` / `readToken()` helper — no raw hex in component code.
- Chart data driven by `report.easyCount` / `mediumCount` / `hardCount` — updates automatically with active filters.
- `recharts` added to `package.json` dependencies.

### 3.3 — AI Generator "Save & playtest" (AiGenerator.js, Game.js)
- Third button added next to "Reset" / "Save level": **Save & playtest**.
- Flow: POST `/Ai/save-preview` → receive `id` → navigate to `/play?level=<id>&from=ai-generator&<form-params>`.
- All form constraint fields (difficulty, rows, columns, theme, etc.) are preserved as URL params round-trip.
- On return: `saved=1` appended to URL → AiGenerator shows one-time confirmation banner.
- `AiGenerator.js` form state initialized from URL params (so a direct link or back-navigation restores form).

### 3.3 — Game.js unified entry & return routing
- Unified `useEffect` handles both entry paths: URL params (AI Generator) and `location.state` (Level Editor).
- `fromContext` state (`"ai-generator"` | `"level-editor"` | `null`) drives all exit paths.
- `returnToContext()` callback: AI Generator path preserves form params + adds `saved=1`; Level Editor path navigates to `/levels` with `{ state: { reopenEditor: selectedLevel } }`.
- All exit paths (Level Complete → Next, Level Complete → Save, Level Complete → Change, Main Menu, Level Select) return to originating context. Only Replay stays on the level.

### 3.3 — Level Editor return-to-editor (Levels.js)
- `onPlayTest` now passes `from: "level-editor"` in navigate state.
- Mount-once `useEffect` reads `location.state?.reopenEditor` and calls `setEditingLayout()` to reopen the layout editor automatically.
- `window.history.replaceState({}, "")` clears the state so browser Back doesn't re-trigger the effect.

### Carry-over: Adjacency seam fixes (GameCanvas.js)
- **Barriers left/right:** `barrierRightEdges` / `barrierLeftEdges` sets built in `rebuildBarrierEdges`; side border strokes suppressed when same-color barrier abuts.
- **Platforms all 4 sides:** `platTopEdges`, `platBottomEdges`, `platRightEdges`, `platLeftEdges` sets; border lines skipped when same-type platform abuts (no fill change).
- **Kill bricks all 4 sides:** `kbTopEdges`, `kbBottomEdges`, `kbRightEdges` sets; core strip margins extend to 0 when adjacent; edge highlight lines suppressed.
- Top/bottom barrier seam fix from Phase 2B was left intact; these additions are additive.

### Carry-over: Controls hint on completion overlay
- Confirmed pre-fixed in Phase 2A: `GameCanvas.js:1165` guard `completionTime === null` already hides the hint when overlay is showing. No change needed.

---

## Acceptance criteria status

| Criterion | Status |
|-----------|--------|
| Kebab: all 4 action groups present | ✅ |
| Kebab: Esc / arrow / Enter keyboard nav | ✅ |
| Kebab: ARIA roles and attributes | ✅ |
| Kebab: dropdown not clipped by table | ✅ |
| Chart: 3 colored bars match badge palette | ✅ |
| Chart: CSS tokens via getComputedStyle | ✅ |
| Chart: updates with active filters | ✅ |
| Save & playtest: saves as draft | ✅ |
| Save & playtest: form params round-trip | ✅ |
| All exit paths return to originating context | ✅ |
| Level Editor autoPlay also returns to editor | ✅ |
| Adjacency seams: barrier L/R | ✅ |
| Adjacency seams: platform all 4 | ✅ |
| Adjacency seams: kill brick all 4 | ✅ |
| Build: no new ESLint warnings | ✅ |
| Backend tests: 24/24 | ✅ |

---

## Deviations from plan

- None. All features implemented as specified. The Level Editor `from` context retrofit was identified as needed during investigation and implemented as part of 3.3.

---

## Known issues / not in scope

- `handleEdit` (metadata form for existing levels, defined at `Levels.js:100`) is unused — this was pre-existing before Phase 3. The Kebab "Edit" action opens the layout editor, matching the original pre-Phase-3 button behavior. The metadata form remains accessible only for new level creation via the "+ New level" button. A future phase could expose metadata editing through the kebab.
- Pre-existing ESLint warnings in `LevelEditor.js`, `GameCanvas.js`, `Game.js`, `Levels.js`, `Reports.js` — all carry-overs from Phase 1/2, none introduced by Phase 3.
- `recharts` package added; `package-lock.json` updated accordingly.

---

## Codebase map (Phase 3 touch points)

| File | Change |
|------|--------|
| `src/pages/Levels.js` | KebabMenu component + kebabStyles; reopenEditor mount effect; `from: "level-editor"` on playtest navigate |
| `src/pages/Reports.js` | `readToken()` helper, `chartColors` ref, Recharts chart card between KPI strip and table |
| `src/pages/AiGenerator.js` | `useSearchParams`, form init from URL params, `playtesting` state, `handleSaveAndPlaytest`, `saved` param confirmation effect |
| `src/pages/Game.js` | `useSearchParams`, `useNavigate`, `fromContext` state, `returnToContext`, unified entry useEffect, exit handlers updated |
| `src/components/game/GameCanvas.js` | `platRightEdges`/`platLeftEdges` sets in `loadLevel`; `kbTopEdges`/`kbBottomEdges`/`kbRightEdges` sets; barrier `barrierRightEdges`/`barrierLeftEdges` in `rebuildBarrierEdges`; conditional side border strokes for barriers/platforms/kill bricks |
| `package.json` / `package-lock.json` | `recharts` dependency added |

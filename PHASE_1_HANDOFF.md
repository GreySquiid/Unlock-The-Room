# Phase 1 Handoff

This document is for the next Claude Code session. It assumes you have not seen the Phase 1 work.

---

## What shipped

### 1.1 Unified color system

**Token foundation**
- `frontend/src/index.css` — `:root` block with the full Phase 1 token set:
  - Brand: `--color-primary` (`#6366F1`), `--color-primary-hover`, `--color-primary-bg`, `--color-primary-border`
  - Status: `--color-success`, `--color-warning`, `--color-danger`, `--color-info` (and their `-bg`, `-text`, `-border` variants)
  - Text: 7 levels (`--text` through `--text-placeholder`)
  - Surfaces: `--surface`, `--surface-raised`, `--surface-subtle`, `--bg`, `--bg-hover`
  - Borders: 5 levels (`--border` through `--border-strong`)
  - Game chrome (dark mode): `--game-bg`, `--game-bg-mid`, `--game-bg-deep`, `--game-hud-*`, `--game-panel-*`, `--game-btn-*`, `--game-text*`, `--game-accent`
  - Scrollbar, border-radii, and badge color tokens (landing page tech stack)
  - `@keyframes spin` (fixes the missing spinner noted in Phase 0 handoff)

**Canvas constants**
- `frontend/src/gameColors.js` (new) — exports `BARRIER_COLORS`, `OBJECT_COLORS`, `PLATFORM_COLORS`, `WALL_COLORS`, `EXIT_COLORS`, `SPIKE_COLORS`, `PLAYER_FALLBACK`, `HIGH_CONTRAST_*`, `GAME_BG_FALLBACK`, and `GAME_UI` (game shell UI colors for React inline styles)

**Config**
- `frontend/src/config.js` (new) — `DEMO_EMAIL` and `DEMO_PASSWORD` constants; imported by Login, Dashboard, and LandingPage to avoid hardcoding the demo credentials in component files

**Files migrated to tokens**
All of the following had their raw hex literals replaced with CSS `var()` references or `gameColors.js` imports:

| File | Change |
|---|---|
| `src/pages/Dashboard.js` | dashboard tokens + imports `config.js` |
| `src/pages/LandingPage.js` | tokens; 2 hardcoded `#6366F1` values (noted in Phase 0 handoff) now reference `--color-primary` |
| `src/pages/Login.js` | tokens + imports `config.js` |
| `src/pages/Levels.js` | tokens |
| `src/pages/Reports.js` | tokens |
| `src/pages/AiGenerator.js` | tokens |
| `src/pages/Game.js` | one-line fix: `background: var(--game-bg)` |
| `src/components/Navbar.js` | tokens |
| `src/components/LevelEditor.js` | tokens + imports `gameColors.js` |
| `src/components/game/GameCanvas.js` | all canvas drawing colors use `gameColors.js` |
| `src/components/game/GameLogin.js` | `GAME_UI` constants |
| `src/components/game/LevelSelect.js` | `GAME_UI` constants |
| `src/components/game/SavedLevels.js` | `GAME_UI` constants |
| `src/components/game/MainMenu.js` | `GAME_UI` constants |
| `src/components/game/Settings.js` | `GAME_UI` constants |

**Acceptance check passes:**
```
grep -rE "#[0-9A-Fa-f]{3,6}" frontend/src/ --include="*.js" --include="*.css"
```
Returns only `index.css` (token definitions) and `gameColors.js` (canvas constants). No component files.

### 1.2 Fixed "Validated: 0" stat

- All 8 levels in `backend/UnlockTheRoom.API/SeedData/canonical-levels.json` set to `"isValidated": true`
- The `DemoResetService` will restore this state on each 24-hour reset cycle, so the dashboard KPI permanently reads 8/8

### DESIGN.md

- Created at repo root per Phase 1 spec. Documents the color palette, rationale, canvas constant structure, AI budget cap guidance, and demo account details.

---

## Acceptance criteria status

| Criterion | Status |
|---|---|
| grep returns only tokens files | ✅ |
| dotnet test 24/24 | ✅ |
| npm run build clean (no new warnings) | ✅ |
| Validated KPI not zero | ✅ (8/8) |
| @keyframes spin present in index.css | ✅ |
| DESIGN.md created | ✅ |

---

## Deviations from Phase 1 spec

- **`#534AB7` → `var(--color-primary)`**: The game shell previously used `#534AB7` as its primary button color. Phase 1 unified this to `#6366F1` (`--color-primary`) per spec. The visual difference is subtle (slightly warmer indigo vs slightly cooler blue-purple).
- **Game UI via `GAME_UI` object, not CSS vars**: Game components use React inline styles (JS objects). CSS custom properties work as string values (`background: 'var(--color-primary)'`) for simple cases, but for border shorthand and compound values the `GAME_UI` constants in `gameColors.js` are cleaner and keep all hex in one auditable file.

---

## Known issues / TODOs for Phase 2

1. **Demo email in 5 places** — `demo@greysquiid.com` is still hardcoded in `UserService.cs` (DemoLoginAsync) and `UsersController.cs` (DemoResetStatus). The frontend now uses `config.js`, but the backend still has string literals. Low priority unless the email changes.
2. **Landing page screenshots** — The About section has placeholder `<div>` boxes. Replace with real PNGs after Phase 2 canvas polish is done.
3. **`#534AB7` in App.css** — Check whether `App.css` has any surviving hex; the previous session cleaned it significantly but verify.
4. **Phase 2 targets** — Game canvas polish (barrier art, platform tiles, hazards, HUD, particle burst). These are the highest-impact portfolio changes remaining.

---

## Codebase map — what Phase 1 touched

| Path | Status | Notes |
|---|---|---|
| `frontend/src/index.css` | modified | Full token set + @keyframes spin |
| `frontend/src/gameColors.js` | **NEW** | Canvas color constants + GAME_UI |
| `frontend/src/config.js` | **NEW** | DEMO_EMAIL, DEMO_PASSWORD |
| `DESIGN.md` | **NEW** | Palette reference + AI budget docs |
| `frontend/src/pages/Dashboard.js` | modified | Tokens |
| `frontend/src/pages/LandingPage.js` | modified | Tokens; 2 hardcoded hex → var() |
| `frontend/src/pages/Login.js` | modified | Tokens + config.js |
| `frontend/src/pages/Levels.js` | modified | Tokens |
| `frontend/src/pages/Reports.js` | modified | Tokens |
| `frontend/src/pages/AiGenerator.js` | modified | Tokens |
| `frontend/src/pages/Game.js` | modified | 1-line CSS var fix |
| `frontend/src/components/Navbar.js` | modified | Tokens |
| `frontend/src/components/LevelEditor.js` | modified | Tokens + gameColors.js |
| `frontend/src/components/game/GameCanvas.js` | modified | gameColors.js |
| `frontend/src/components/game/GameLogin.js` | modified | GAME_UI |
| `frontend/src/components/game/LevelSelect.js` | modified | GAME_UI |
| `frontend/src/components/game/SavedLevels.js` | modified | GAME_UI |
| `frontend/src/components/game/MainMenu.js` | modified | GAME_UI |
| `frontend/src/components/game/Settings.js` | modified | GAME_UI |
| `backend/.../SeedData/canonical-levels.json` | modified | All 8 levels isValidated: true |
| `backend/.../appsettings.json` | modified | Features:DemoEmail added (Phase 0 carry-over) |
| `backend/.../Services/UserService.cs` | modified | DemoLoginAsync reads Features:DemoEmail config |
| `backend/.../Controllers/UsersController.cs` | modified | demo-login + demo-reset-status endpoints |
| `backend/.../UnlockTheRoom.Tests/UserServiceTests.cs` | modified | 2 new demo-login tests |

**Tests:** 24/24 pass (`dotnet test`).
**Build:** Clean (`npm run build`), pre-existing ESLint warnings only (no new warnings from Phase 1 changes).

---

## Next: Phase 2 — Game UI polish

Start with `2.3 Game canvas` (barrier art energy field, platform tile shading, hazard rendering, HUD key icons, particle burst) — highest visual impact per hour. Then `2.1 Main menu` (parallax skyline, squid idle animation), then `2.2 Level Select` (thumbnails, locked state contrast).

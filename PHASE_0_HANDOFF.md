# Phase 0 Handoff

This document is for the next Claude Code session. It assumes you have not seen the Phase 0 work.

---

## What shipped

**Frontend**
- `/` — new `LandingPage.js`: hero, three CTA cards (Tour dashboard / Play / GitHub), tech-stack badges, about section with placeholder screenshot boxes, squid PNG from `public/assets/squid-sprite.png`
- `/play` — the game (was `/game`; renamed everywhere including the `api.js` 401 redirect and the Levels.js playtest button)
- `Login.js` — demo panel below the form: credentials displayed, Fill button, "Log in as demo" one-click button

**Backend**
- `POST /api/Users/demo-login` — issues a JWT for `demo@greysquiid.com` with no password; guarded by `Features:DemoLogin` flag in `appsettings.json` and a 30 req/min per-IP rate limit
- `GET /api/Users/demo-reset-status` — returns `{ lastResetUtc }` for the demo-footer; only accessible to the demo user
- `POST /api/Ai/generate-preview` and `generate-and-save` — now rate-limited at 10 req/hour per IP via the `ai-generate` policy
- `DemoResetService` (`BackgroundService`) — fires 10 s after startup, then every `DemoReset:IntervalHours` (default 24). Reads `backend/UnlockTheRoom.API/SeedData/canonical-levels.json`, deletes visitor-created levels (name not in canonical set), restores canonical levels and their game objects. Cascade deletes handle scores and saved-levels automatically.
- `appsettings.json` — all secrets (API key, JWT key, DB connection) replaced with empty strings. Real values go in `appsettings.Development.json` (gitignored) locally and Railway env vars in production.

**Tests:** 24 pass (was 22; added `DemoLoginAsync_WhenDemoUserExists` and `DemoLoginAsync_WhenDemoUserDoesNotExist`).

---

## Deviations from the original plan

- **Screenshot placeholders:** The landing page "About" section has two placeholder `<div>` boxes where screenshots should appear. The plan called for "one or two screenshots" — real images should be dropped in during Phase 1 or after.
- **Spinner keyframe:** `LandingPage.js` uses `animation: 'spin 0.7s linear infinite'` as an inline style. There is no `@keyframes spin` in `index.css`, so the spinner is invisible (the button disables correctly, but no visual spin). Add the keyframe to `index.css` during Phase 1's CSS work.
- **No admin reset endpoint:** The plan offered a fallback HTTP endpoint (`POST /api/admin/reset-demo-data`) for Railway cron. Not built — the `BackgroundService` approach was sufficient.

---

## Known issues / TODOs for next session

1. **Spinner missing keyframe** — add `@keyframes spin { to { transform: rotate(360deg); } }` to `index.css`.
2. **Landing page screenshots** — replace the two placeholder divs in the About section with actual PNGs once Phase 2 canvas polish is done.
3. **Demo email in five places** — `demo@greysquiid.com` is hardcoded as a constant in `LandingPage.js`, `Login.js`, `Dashboard.js` (frontend) and as a string literal in `UserService.cs` (`DemoLoginAsync`) and `UsersController.cs` (`DemoResetStatus`). If the email ever changes, update all five.
4. **`DemoReset:LastResetUtc`** — the dashboard footer shows "Demo reset pending" until the first reset fires (~10 s after deploy). This is cosmetic and expected.
5. **Railway env vars required** — `ANTHROPIC__APIKEY`, `JWT__KEY`, `ConnectionStrings__DefaultConnection`. The committed `appsettings.json` has empty strings for all three; the app will fail to start without them set in Railway.

---

## Codebase map — what changed

| Path | Status | Notes |
|---|---|---|
| `frontend/.../src/pages/LandingPage.js` | **NEW** | Root landing page |
| `backend/.../Services/DemoResetService.cs` | **NEW** | 24 h reset background service |
| `backend/.../SeedData/canonical-levels.json` | **NEW** | Canonical data for 8 seed levels |
| `frontend/.../src/App.js` | modified | `/` → LandingPage, `/play` → Game (was `/game`) |
| `frontend/.../src/services/api.js` | modified | 401 redirect → `/play` |
| `frontend/.../src/pages/Dashboard.js` | modified | `/play` link; demo-reset footer |
| `frontend/.../src/pages/Login.js` | modified | Demo credentials panel |
| `frontend/.../src/pages/Levels.js` | modified | Playtest navigate → `/play` |
| `backend/.../Controllers/UsersController.cs` | modified | `demo-login` + `demo-reset-status` endpoints |
| `backend/.../Controllers/AiController.cs` | modified | `ai-generate` rate limit on generate endpoints |
| `backend/.../Services/UserService.cs` | modified | `DemoLoginAsync()` |
| `backend/.../Program.cs` | modified | `AddRateLimiter`, `AddHostedService<DemoResetService>`, `UseRateLimiter` |
| `backend/.../appsettings.json` | modified | Secrets cleared; `Features:DemoLogin`, `DemoReset:IntervalHours` added |
| `backend/.../UnlockTheRoom.API.csproj` | modified | `<Content Update>` for canonical JSON |
| `.gitignore` | modified | `appsettings.Development.json` added |
| `backend/UnlockTheRoom.Tests/UserServiceTests.cs` | modified | 2 new demo-login tests |

**Git remotes:** `origin` is the WGU GitLab (protected branch — pushes will fail). All pushes go to `git push github main`.

---

## Design convention established in Phase 0

`#6366F1` (indigo) was used as the primary action color in `LandingPage.js` and the Login demo panel. Phase 1 is supposed to formally adopt this as the single primary token across dashboard and game. When Phase 1 defines the token, replace the two hardcoded hex values in those files.

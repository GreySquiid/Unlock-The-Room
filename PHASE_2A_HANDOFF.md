# Phase 2A Handoff

This document is for the next Claude Code session. It assumes you have not seen the Phase 2A work.

---

## What shipped

### Carry-over: App.css hex check (Phase 1 TODO #3)

`frontend/src/App.css` contains only a single comment line — zero hex literals. Nothing to fix. Confirmed and closed.

### 2.1 Main menu — bring it to life

**New file: `ParallaxBackground.js`**
- Full-screen `<canvas>` with `position: fixed; z-index: 0; pointer-events: none`.
- Three procedural layers rendered every rAF frame:
  - **Stars** (20 dots, opacity oscillating on a sine wave at 2–3s periods)
  - **Far layer** (`utr-bg.png` tiled horizontally, scrolling at 5 px/s, 55% alpha)
  - **Mid layer** (dark building silhouettes at 15 px/s — ground at 72% of viewport height)
  - **Near layer** (darker foreground shapes at 30 px/s + solid ground strip — ground at 84%)
- All building data generated at **module scope** from hardcoded seeds (`0xdeadbeef` mid, `0xcafebabe` near, `0xf00dcafe` stars) using Mulberry32 PRNG — identical every visit, no per-mount randomization.
- `prefers-reduced-motion: reduce` → draws a single static frame and stops; no rAF loop started.
- Tab-hidden pausing: `visibilitychange` listener stops/resumes the loop without counting the hidden interval as elapsed time.

**Updated `MainMenu.js`**
- Renders `<ParallaxBackground />` behind all content.
- Translucent dark panel (`rgba(8,6,22,0.62)` + `backdrop-filter: blur(6px)`) behind the title and button column for readability against the animated background.
- `SquidCanvas` component (inline): small canvas (64×80px + 6px platform) positioned `right: -82px` from the menu column. Animates through the 4 idle frames of `squid-sprite.png` at 8 ticks/frame (~7.5 fps). Stops on reduced motion. Platform drawn using `PLATFORM_COLORS` constants.

### 2.2 Level select — fill the void, add information density

**New file: `LevelThumbnail.js`**
- `<canvas>` at 80×50 px wrapped in `React.memo`.
- Paints game objects as colored squares: Keys and Barriers use `BARRIER_COLORS[color]` (with correct constant fallbacks), ExitDoor = `OBJECT_COLORS.ExitDoor`, Platform/hazard-Platform = `OBJECT_COLORS.Platform`, Hazard/KillBrick = `OBJECT_COLORS.KillBrick`. SpawnPoint skipped.
- All hex constants imported from `gameColors.js` — no raw hex literals in the file.

**Updated `LevelSelect.js`**
- Renders `<ParallaxBackground />` for visual consistency with the main menu.
- Card container `z-index: 1` over the parallax canvas.
- **Parallel detail fetches**: after the level list loads, one `api.get("/Levels/{id}/detail")` per level fires in parallel (no `await` — each resolves independently). Each sets `levelDetails[levelId]` via functional state update, causing incremental thumbnail renders. Cards show a dark skeleton placeholder until their detail arrives.
- **Personal best times**: `fetchScores()` now builds a `myBestTimes` map from `/Scores/mine` (minimum `completionTimeSeconds` per level). Replaces the global leaderboard display. Best time shown only for logged-in players.
- **Locked card contrast fix**: `opacity: 0.35` → `0.5`; padlock emoji gets `filter: "grayscale(1) brightness(5)"` so it renders as a visible white icon.
- **Completion star**: gold `★` (`color: var(--color-warning)`) in the top-right of cards where `completedIds.includes(level.id) && unlocked`.
- `fetchLeaderboard` call removed — global leaderboard is no longer displayed on this screen.

### 2.4 Level complete screen — game-feel touches

**Updated `GameCanvas.js`**
- New `prevBestSeconds` state (null = no prior run for this player on this level).
- New `useEffect([player, level.id])`: fetches `/Scores/mine`, filters to `level.id`, picks the minimum to get the personal best before the current run starts. Fires at level load — well before the player can complete the level.
- **Completion overlay additions**:
  - `★ First completion!` or `★ New best!` callout (gold, animated via `newBestBounce` CSS keyframe) — shown only for logged-in players, only on strict improvement (`<`, not `≤`). First completion shows when `prevBestSeconds === null`.
  - `Best: XX:XX` line (dim, tabular-numeral font) shown below the current time when `prevBestSeconds !== null` and player is logged in — gives context even when the run was not a new best.
- **Controls hint hidden**: `settings?.showControls && completionTime === null` — hint disappears when the completion overlay is showing.

**Updated `index.css`**
- `@keyframes newBestBounce`: fade-in + scale bounce (0→0.6→1.15→0.97→1.0 over 0.5s ease-out).

---

## Acceptance criteria status

| Criterion | Status |
|---|---|
| Main menu has continuous parallax motion (3 layers) | ✅ |
| Squid idle-animating on main menu | ✅ |
| Buttons readable against moving background | ✅ (translucent panel) |
| Level select uses same parallax background | ✅ |
| Locked cards at ~0.5 opacity, visible padlock | ✅ |
| Level thumbnails render actual object layout | ✅ (incremental, skeleton-first) |
| Personal best time on completed level cards | ✅ (from /Scores/mine) |
| Gold ★ on completed level cards | ✅ |
| Completion screen shows "★ New best!" on strict improvement | ✅ |
| Completion screen shows "★ First completion!" on first run | ✅ |
| Previous best time shown for context | ✅ |
| Controls hint absent on completion screen | ✅ |
| prefers-reduced-motion respected (no rAF loop) | ✅ |
| App.css hex check confirmed clean | ✅ |
| No hex literals outside gameColors.js / index.css | ✅ (grep returns nothing) |
| dotnet test 24/24 | ✅ |
| npm run build — no new warnings | ✅ (only pre-existing ESLint warnings) |

---

## Deviations from Phase 2A spec

- **Parallax "skyline" is procedural, not a sprite asset.** There were no separate parallax layer assets (only `utr-bg.png` as a single flat image). The far layer uses `utr-bg.png` at 55% alpha; the mid and near layers are procedural rectangle silhouettes generated from seeded PRNG. Visually equivalent to the spec intent.
- **Level Select global leaderboard removed.** The spec said to "pull from the existing scores endpoint" for best time. Both `/Scores/mine` (personal) and `/Scores/leaderboard` (global) qualify. Personal best was chosen as more meaningful to the player. The `fetchLeaderboard` call is gone; the `leaderboard` state variable is gone entirely.
- **Thumbnail background uses `GAME_BG_FALLBACK` (`#1a1a2e`) instead of `#12122a`.** One shade lighter than the hand-picked value, indistinguishable at 80×50px. Keeps the hex-token invariant intact.
- **Squid is positioned to the right of the button column via absolute positioning**, not on a separate overlay canvas. The squid canvas is `right: -82px` from the `menuRow` wrapper. On very narrow screens the squid could clip. Not a concern for portfolio screenshots.

---

## Known issues / TODOs for next session

1. **Phase 2.3 (game canvas art)** — barrier energy field, platform tile shading, hazard rendering, HUD key icons, and particle burst on key collect. This is the highest-impact remaining work and was explicitly deferred to a separate session due to scope.
2. **Landing page screenshots** — The About section still has placeholder `<div>` boxes. Replace with real PNGs after Phase 2.3 canvas polish is complete.
3. **Demo email still in backend string literals** — `demo@greysquiid.com` is hardcoded in `UserService.cs` and `UsersController.cs`. Low priority unless the email changes.
4. **`completed` state variable in GameCanvas** — `const [completed, setCompleted] = useState(false)` is set to `false` in two places but never read. Pre-existing dead variable; harmless but worth cleaning up in a follow-up.
5. **Level Select card width** — card was widened to 600px (from 560px) to accommodate the thumbnail. On screens below ~650px the card will overflow. Not a concern for portfolio use (desktop screenshots only).

---

## Codebase map — what Phase 2A touched

| Path | Status | Notes |
|---|---|---|
| `frontend/src/components/game/ParallaxBackground.js` | **NEW** | Shared parallax canvas for menu + level select |
| `frontend/src/components/game/LevelThumbnail.js` | **NEW** | Memoized mini-canvas showing level layout |
| `frontend/src/components/game/MainMenu.js` | modified | ParallaxBackground, SquidCanvas, translucent panel |
| `frontend/src/components/game/LevelSelect.js` | modified | ParallaxBackground, thumbnails, personal best, star, locked contrast |
| `frontend/src/components/game/GameCanvas.js` | modified | prevBestSeconds state + fetch, completion overlay, controls hint |
| `frontend/src/index.css` | modified | `@keyframes newBestBounce` added |

**Tests:** 24/24 pass.
**Build:** Clean — `Compiled with warnings` (all pre-existing ESLint warnings; no new warnings from Phase 2A changes).

---

## Hex token invariant — confirmed clean

```
grep -rE "#[0-9A-Fa-f]{3,6}" frontend/src/ --include="*.js" --include="*.css"
```

Returns only `index.css` and `gameColors.js`. All new files comply.

---

## Next: Phase 2.3 — Game canvas art

Start with **barrier energy field** (highest visual lift per hour):
- Vertical/diagonal gradient in the barrier's color
- Scrolling stripe pattern offset by `Date.now() / 60`
- Subtle glow via `ctx.shadowColor` / `ctx.shadowBlur`
- Bright cap lines at top and bottom

Then in order: platform tile shading (already partially done via `PLATFORM_COLORS`), hazard rendering refinements, HUD key icons, particle burst on key/exit collect.

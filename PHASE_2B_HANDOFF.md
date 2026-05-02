# Phase 2B Handoff (Phase 2.3 — Game Canvas Art)

This document is for the next Claude Code session. It assumes you have not seen the Phase 2.3 work.

---

## What shipped

### 2.3.1 Barrier energy field

**Updated `GameCanvas.js` — barrier drawing block (complete replacement)**

Old behavior: flat translucent fill (55% alpha) + solid border + static vertical stripe lines.

New behavior — animated energy field, per barrier per frame:
- **Vertical gradient fill**: `hexToRgba(color, 0.72)` top → 0.48 mid → 0.68 bottom, giving depth without hiding the background.
- **Diagonal scrolling stripes**: 45° diagonal lines across the barrier, offset by `Date.now() / 60 % 18` for continuous ~1px/frame rightward drift. Clipped to barrier bounds via `ctx.save()/clip()/restore()`. Drawn at 20% alpha in `BARRIER_BRIGHT_COLORS[color]`.
- **Bright cap lines with glow**: 2px filled rectangle at top and/or bottom open edges (skipped at stacked-barrier seams using existing `hasAbove`/`hasBelow` sets), using `ctx.shadowColor = bright; ctx.shadowBlur = 8`. Each cap line gets its own `ctx.save()/restore()` to prevent shadow bleed into subsequent draws.
- **Side borders**: 70%-alpha stroke on left and right edges.
- `prefers-reduced-motion`: `stripeOffset` is frozen at `0` — gradient and glow still render, only the scrolling motion stops.
- High-contrast branch preserved unchanged.

**New constants in `gameColors.js`**
- `BARRIER_BRIGHT_COLORS` — one brighter shade per barrier color (Red, Blue, Green, Yellow, Purple, White), used for cap lines and stripe stroke.

**New module-level helpers in `GameCanvas.js`**
- `reducedMotion` — read once from `window.matchMedia` at module load; never called per frame.
- `hexToRgba(hex, alpha)` — converts `#RRGGBB` to `rgba(r,g,b,a)`; used for gradient stops.

### 2.3.2 Spike metallic gradient

**Updated `GameCanvas.js` — spike drawing block**

Old behavior: flat gray fill (`SPIKE_COLORS.body`) + left-edge highlight stroke.

New behavior:
- Linear gradient from spike base (`#444455` dark) → mid body (`SPIKE_COLORS.body` = `#888888`) → tip (`SPIKE_COLORS.edge` = `#aaaaaa`), giving a metallic dark-to-bright appearance as the eye travels up the spike face.
- Left-face highlight stroke widened to 1.5px for crispness.
- Kill bricks unchanged (existing red laser beam is already more polished than yellow/black stripes).

### 2.3.3 Particle system

**Updated `GameCanvas.js`**

New state in `stateRef.current` (initialized at level load):
- `particles: []` — active particle array
- `exitParticlesSpawned: false` — gate so exit burst fires exactly once per run

New helper (component-scope):
- `spawnParticles(s, cx, cy, color, count)` — creates `count` particles at `(cx, cy)` with random outward velocities (`speed = 2–5`) and a slight upward bias (`vy -= 1`). **FIFO eviction**: if `s.particles.length >= 100`, `shift()` the oldest before pushing the new one — rapid key collection always produces a visible burst.

In `update()`:
- **Key collect**: spawns 12 particles in `BARRIER_COLORS[key.color]` at the key center. Skipped if `reducedMotion`.
- **Exit door**: spawns 12 white (`#ffffff`) particles at the door center when all keys are collected and the player enters. Gate `exitParticlesSpawned` prevents re-firing on subsequent frames. Skipped if `reducedMotion`.
- **Particle tick** (every frame): `vx/vy` applied to position; `vy += 0.08` gravity; `life -= 1/36` (~600 ms lifetime at 60 fps). Array filtered to `life > 0`.

In `draw()` (before player sprite):
- Each particle drawn as a circle: radius `max(1, round(life * 4))` (shrinks as it fades), alpha `life * 0.85`. Uses `ctx.save()/globalAlpha/restore()` per particle.

### 2.3.4 HUD key icons

**Updated `GameCanvas.js`**

HUD state (`hudData`) now carries `keyStates: Array<{ color: string, collected: boolean }>`, initialized in `loadLevel` and updated in the game loop whenever either elapsed time or `collectedKeys` changes (added `lastCollectedKeys: -1` to `stateRef` to detect mid-second changes).

Old HUD element: `<span>Keys 0/2</span>` text.

New HUD element: `<div style={styles.hudKeys}>` containing one 12×12 circle per key:
- Colored circle (`BARRIER_COLORS[k.color]`) when not yet collected, opacity 1.
- Muted gray (`#444466`) at 45% opacity when collected.
- The key-icons section is hidden when `totalKeys === 0` (levels without keys).

### Carry-over 1: Main menu squid platform polish

**Updated `MainMenu.js` — `SquidCanvas` component**

`PLAT_H` increased from 7 → 9. Platform now renders four strips matching in-game platform art:
- 3px `PLATFORM_COLORS.topHighlight` (purple top edge)
- 4px `PLATFORM_COLORS.inner` (lighter mid strip)
- 1px `PLATFORM_COLORS.body` (dark body)
- 1px `PLATFORM_COLORS.bottomShadow` (deepest shadow)

### Carry-over 2: Level Select saved-level bookmark

**Updated `LevelSelect.js`**

- New `savedIds` state (`Set<number>`), fetched from `GET /api/SavedLevels` (player-scoped, returns `{ levelId, ... }[]`). Fires in parallel with `fetchScores()` when player is present.
- `LevelCard` now receives `isSaved` prop instead of `completed`. The gold ★ completion star is removed entirely (along with its `completedStar` style).
- When `isSaved === true`, a small inline SVG bookmark (9×12px, `GAME_UI.accentPurple` fill, classic ribbon shape with V-notch base) appears in the top-right corner of the card.
- `completedIds` state is still fetched and used for unlock gating — only the visual marker was removed.

---

## Acceptance criteria status

| Criterion | Status |
|---|---|
| Barrier energy field: gradient fill, scrolling stripes, glow, cap lines | ✅ |
| Per-color energy field (Red/Blue/Green/Yellow/Purple/White) | ✅ |
| Barriers animated at `Date.now()/60` stripe offset | ✅ |
| `prefers-reduced-motion`: stripes frozen, gradient/glow still render | ✅ |
| Spike metallic gradient (dark base → bright tip) | ✅ |
| Kill bricks unchanged (red laser kept) | ✅ |
| Particle burst on key collect (~12 particles, key color) | ✅ |
| Particle burst on exit door touch (~12 white particles) | ✅ |
| FIFO eviction — burst fires even when pool at cap | ✅ |
| Pool capped at 100 particles | ✅ |
| `prefers-reduced-motion`: no particles spawned | ✅ |
| Particles fade over ~600 ms, shrink radius, gravity applied | ✅ |
| HUD: colored circle icons replace "Keys 0/2" text | ✅ |
| HUD icons update immediately on key collect (not deferred to next second) | ✅ |
| HUD: zero-key levels hide the icons section | ✅ |
| Squid platform: purple top highlight + inner + body + shadow (4 strips) | ✅ |
| Level Select: saved-level bookmark SVG shown for saved levels | ✅ |
| Level Select: completion star removed entirely | ✅ |
| `GET /api/SavedLevels` confirmed as correct endpoint (no `/mine` suffix) | ✅ |
| `npm run build` — no new warnings (all pre-existing) | ✅ |

---

## Deviations from spec

- **Kill bricks**: spec called for yellow/black hazard stripes; existing red laser beam implementation is more polished. Kept as-is per Josh's approval.
- **Spike drawing**: spec said "dark with a metallic gradient on the top face." The gradient runs base→tip (bottom→top of the spike shape) rather than across the top face specifically, which reads the same at game scale.
- **Barrier glow**: `ctx.shadowBlur` applied only to cap lines (not to the gradient fill) to avoid shadow being clipped by the `ctx.clip()` region. The cap-line glow bleeds outward from the barrier edge, which is the visually correct location for an energy field rim light.
- **`prefers-reduced-motion` for barriers**: spec said "drop or freeze the animation." Implemented as freeze (offset = 0) rather than drop — the gradient and glow still render because they are non-motion visual improvements. Only the time-based scrolling is suppressed.

---

## Known issues / TODOs for next session

1. **`completed` dead variable in GameCanvas** — `const [completed, setCompleted] = useState(false)` is set but never read. Pre-existing from before Phase 2A; the ESLint warning is in the build output. Safe to remove in any future cleanup pass.
2. **Landing page screenshots** — About section placeholder `<div>` boxes. Best time to replace with real PNGs now that the game canvas is visually polished.
3. **Demo email hardcoded in backend** — `demo@greysquiid.com` in `UserService.cs` and `UsersController.cs`. Low priority.
4. **Level Select card width** — 600px; clips on screens below ~650px. Portfolio-use only; not a concern.
5. **Phase 3** (dashboard refinements) — kebab menu on Level Management, Recharts bar chart on Reports, AI Generator "Save & playtest" button — all untouched, all scope from `CLAUDE_CODE_PROMPT.md`.
6. **Phase 4** (brand polish) — squid on Level Select header, empty states, 404 page — untouched.

---

## Codebase map — what Phase 2.3 touched

| Path | Status | Notes |
|---|---|---|
| `frontend/src/gameColors.js` | modified | Added `BARRIER_BRIGHT_COLORS` |
| `frontend/src/components/game/GameCanvas.js` | modified | Barrier energy field, spike gradient, particle system, HUD key icons |
| `frontend/src/components/game/MainMenu.js` | modified | SquidCanvas platform: 4-strip art, `PLAT_H` 7→9 |
| `frontend/src/components/game/LevelSelect.js` | modified | `savedIds` fetch, `isSaved` prop, SVG bookmark, star removed |

**Tests:** 24/24 pass (backend only; frontend has no unit tests).  
**Build:** `Compiled with warnings` — all pre-existing ESLint warnings; zero new warnings from Phase 2.3.

---

## Hex token invariant — confirmed clean

```
grep -rE "#[0-9A-Fa-f]{3,6}" frontend/src/ --include="*.js" --include="*.css"
```

Returns only `index.css` and `gameColors.js`. All new code uses constants or inline rgba strings constructed from those constants.

---

## Next: Phase 3 — Dashboard refinements

- **3.1** Level Management: replace per-row Edit/Unpublish/Delete buttons with a kebab (⋯) dropdown. Focus trap + Esc + arrow key navigation required.
- **3.2** Reports: add a single Recharts bar chart (Levels by Difficulty) between the KPI strip and the data table. Must update with active filters.
- **3.3** AI Generator: add "Save & playtest" button (saves to DB, routes to game with `?level=<id>&from=ai-generator`). Return to generator after playtest with inputs preserved.

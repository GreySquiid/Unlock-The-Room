# Design Reference — Unlock The Room

## Color system

Two surfaces, one palette. The dashboard (React, light background) and the game (HTML5 Canvas, dark background) were previously styled independently. Phase 1 unified them under a single token set.

### Rationale

The game used `#534AB7` / `#7F77DD` (a blue-biased purple). The dashboard used generic Bootstrap-style blue. Neither felt intentional. We adopted the game's purple family and pushed it slightly warmer toward indigo (`#6366F1`) — the same shade Tailwind calls `indigo-500` — so that primary actions look the same whether you're in the dev dashboard or the game's main menu.

### CSS tokens (`:root` in `index.css`)

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#6366F1` | Primary action buttons, focus rings |
| `--color-primary-hover` | `#4F46E5` | Primary button hover state |
| `--color-primary-bg` | `#EEF4FF` | Subtle tinted backgrounds |
| `--color-primary-border` | `#C9C5F0` | Tinted borders |
| `--color-success` | `#10B981` | Published badges, success states |
| `--color-warning` | `#F59E0B` | Medium difficulty, caution states |
| `--color-danger` | `#EF4444` | Destructive actions, error text |
| `--color-info` | `#3B82F6` | Informational badges |

Surface, text, border, and scrollbar neutrals (light mode) and game chrome tokens (dark mode) are also defined in `index.css`. See the file for the complete set.

### Canvas color constants (`src/gameColors.js`)

CSS custom properties can't be read synchronously in canvas drawing code. `gameColors.js` exports:

- `BARRIER_COLORS` — per-color barrier fill (Red, Blue, Green, Yellow, Purple, White)
- `OBJECT_COLORS` — object-type colors for the level editor preview grid
- `PLATFORM_COLORS` — procedural platform tile shading
- `WALL_COLORS` — boundary-wall tile colors
- `EXIT_COLORS` — active / inactive exit door states
- `SPIKE_COLORS` — hazard spike rendering
- `GAME_UI` — dark-mode shell colors used in React inline styles for game screens (MainMenu, LevelSelect, GameLogin, SavedLevels, Settings)

### Badge colors (third-party brand)

Tech-stack badges on the landing page use official brand colors declared as CSS tokens: `.NET`, `React`, `PostgreSQL`, `Anthropic API`, `Docker`, `Railway`. These are presentation-only; do not use them for UI chrome.

---

## Monthly AI budget

The Anthropic account has a configurable monthly budget cap. The demo path exposes the AI Generator to any visitor. The per-IP rate limit (10 generations/hour, set via ASP.NET Core `AddRateLimiter`) is the primary guard; the Anthropic console budget cap is the backstop.

Expected cost ceiling for steady demo traffic: well under $5/month at claude-haiku-4-5 pricing. Set the cap to $20/month as a safe buffer.

---

## Demo account

`demo@greysquiid.com` / `Demo@2026!`

Credentials are intentionally public — they appear on the login page and are documented here. The account carries the `Developer` role so visitors see the full dashboard. The `DemoResetService` background job restores the level library to a known-good state every 24 hours (configurable via `DemoReset:IntervalHours` in `appsettings.json`).

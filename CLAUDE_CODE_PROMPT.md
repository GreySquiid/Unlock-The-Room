# Unlock The Room — Portfolio Polish Pass

## Project context

You're working on **Unlock The Room**, a puzzle platformer with a developer management dashboard, originally built as a WGU software engineering capstone (already submitted, no need to preserve any specific UI for grading). The owner is now polishing it as a portfolio centerpiece for SWE applications targeting gaming studios (Twitch, Valve, EA, Scopely), big tech (Microsoft, Amazon, Meta, OpenAI), aerospace (SpaceX, Blue Origin), and startups.

**Stack:**
- Backend: ASP.NET Core (.NET 8), C#, PostgreSQL via Entity Framework Core 8
- Frontend (dashboard): React 18 (JavaScript)
- Game: HTML5 Canvas API (vanilla, no game engine)
- AI integration: Anthropic API (claude-haiku-4-5-20251001) for level generation
- Auth: JWT bearer + BCrypt
- Deploy: Docker on Railway.app
- Tests: xUnit + EF Core InMemory + Moq (22 tests, all passing)

**This is purely a presentation/polish pass.** No schema changes, no auth changes, no new architectural patterns. Every change should improve how the app looks, feels, or reads in screenshots — nothing else.

---

## How to work

Before any code:

1. **Read the codebase structure.** Identify the React app root, the canvas game module(s), where styles or design tokens live today, where static assets are kept, how routing is set up.
2. **Identify existing patterns.** Don't introduce new state management, styling approaches, component libraries, or build tooling unless this document explicitly asks for it. Match what's there.
3. **Plan each phase before executing.** Output a short plan listing the files you'll touch and the order. Wait for confirmation before starting Phase 0, then proceed phase-by-phase.
4. **Commit per phase** with a descriptive message.
5. **Run tests after each phase.** `dotnet test` must pass. The frontend must build without new warnings introduced by your changes.
6. **Manual smoke test after each phase.** Log in as the demo developer (`demo@greysquiid.com` / `Demo@2026!`), navigate through every changed screen, play a level start-to-finish.

If a constraint is ambiguous or you can't find something the prompt references, **ask before guessing**.

The phases are ordered so that partial completion still ships portfolio value. If we run out of time at any point, everything done so far should be deployable and self-contained.

---

## Phase 0 — Public access (do this first)

The dashboard is currently locked behind credentials and recruiters never reach it. The AI Generator and Reports page — the strongest hiring artifacts in the entire project — are invisible to most visitors. **Fix this before any polish work.** Polishing screens nobody sees has zero portfolio impact.

The whole point of this phase is to make `URL → AI Generator in 2 clicks` true for any first-time visitor.

### 0.1 Landing page at `/`

Replace the current root route (which loads the game main menu) with a new landing page. Move the existing game main menu to `/play`.

**Layout:**
- Hero: project name, one-line pitch (something like "AI-assisted puzzle platformer with full-stack admin tooling — a WGU capstone, polished as a portfolio piece")
- Three primary action cards, in this priority order:
  1. **Tour the developer dashboard** → auto-logs in as the demo developer, lands on `/dashboard` (see 0.2/0.3)
  2. **Play the game** → `/play`
  3. **View the code** → external link to the repo (use the GitLab URL for now; if a GitHub mirror exists, link that instead — recruiters check GitHub first)
- Brief "About this project" section: tech stack badges (.NET 8, React, PostgreSQL, Anthropic API, JWT, Docker, Railway), one or two screenshots, a short paragraph highlighting what's interesting (the AI level generation pipeline is the differentiator — call it out)
- Squid mascot somewhere on the page (small, idle-animating if it doesn't fight the layout, otherwise static PNG)

**Routing changes:**
- `/` → new landing page
- `/play` → game main menu (everything previously at `/`)
- All in-game routes (level select, game canvas, level complete) move to live under `/play/*` if they were previously at `/*`. Update any internal links.
- `/login`, `/dashboard`, `/levels`, `/reports`, `/generator` → unchanged after auth

**Acceptance:** Visiting the root URL with no session shows a clean, professional landing page. The "Tour the dashboard" CTA is the most prominent element.

### 0.2 One-click demo login (backend)

Add a new auth endpoint that issues a JWT for the demo developer account without requiring a password. The credentials are already public (they're in the Task 3 design doc and on the login form per 0.4), so this isn't a new security exposure — it just removes friction.

**Implementation:**
- New endpoint: `POST /api/auth/demo-login`
- No request body
- Server-side: load the demo user (`demo@greysquiid.com`), issue a JWT exactly as the normal login flow would, return the same `AuthResponse` shape
- Rate limit: 30 requests/min per IP. Use ASP.NET Core's built-in rate limiter middleware (`AddRateLimiter` with a fixed window). If rate limiting isn't set up yet, add it scoped just to this endpoint and the AI generation endpoint (see 0.6) — don't apply globally.
- Add a feature flag: `appsettings.json` → `"Features": { "DemoLogin": true }`. Endpoint returns 404 if disabled.
- Add an integration test: POST to the endpoint, assert 200 with a valid JWT, assert the JWT carries the Developer role claim.

**Acceptance:** `curl -X POST <api>/api/auth/demo-login` returns a JWT in under 100ms locally. The token works on protected endpoints exactly like a normal login token.

### 0.3 One-click demo login (frontend)

The "Tour the developer dashboard" button on the landing page hits the new endpoint, stores the token, and routes to the dashboard.

**Implementation:**
- Click handler: `POST /api/auth/demo-login` → store token in localStorage exactly like the normal login flow → navigate to `/dashboard`
- Disable the button while the request is in flight; show a small spinner.
- On error (e.g., demo login disabled), show a friendly inline message with a fallback link to `/login` and a note that the demo credentials are visible there.

**Acceptance:** From a fresh browser session with no localStorage, clicking "Tour the developer dashboard" lands on the dashboard within ~1 second.

### 0.4 Login form: show demo credentials and autofill

Visitors who hit `/login` directly (from the user guide doc, a bookmark, or a direct link) should also see the demo path clearly.

**Implementation:**
- Below the login form, add a panel: "Just want to look around? Use the demo account."
- Display the demo email and password visibly.
- Add a "Fill demo credentials" button that populates both fields. The user can then click Log in normally.
- Optionally also offer a "Log in as demo" button that fills + submits in one click — calls the same `/api/auth/demo-login` endpoint as the landing page button.

**Acceptance:** A visitor landing on `/login` can reach the dashboard in two clicks (or one, with the combined button) without typing anything.

### 0.5 Demo data reset

Now that any visitor can edit, delete, and create levels as the demo developer, the level library will drift over time. Recruiter visit #5 might see a library full of placeholder garbage left by visitor #4. Restore to a known-good state automatically.

**Implementation (preferred path — fully self-contained):**

Add a .NET `BackgroundService` (`DemoResetService`) that runs every 24 hours.

- Snapshot the canonical 8 seed levels — names, difficulty, grid sizes, and complete game object lists — into a JSON file at `backend/SeedData/canonical-levels.json`. Check this file into the repo.
- On each scheduled reset:
  - Delete every level not present in the canonical set (anything created by visitors).
  - Restore any modifications to canonical levels back to the snapshot state (reset names, dimensions, game objects).
  - Cascade-delete scores attached to non-canonical levels.
  - Log the reset with counts (deleted N levels, restored M levels, deleted K scores).
- Wire up via `builder.Services.AddHostedService<DemoResetService>()` in `Program.cs`.
- Make the reset interval configurable in `appsettings.json` so it can be tuned (e.g., every 6h during heavy job-application periods).

**Fallback if the BackgroundService approach is awkward on Railway's runtime:** expose `POST /api/admin/reset-demo-data` guarded by a shared secret in the Authorization header (not the Developer JWT — this is a system operation), and trigger it via Railway's native cron job feature or an external pinger like cron-job.org. Same canonical JSON snapshot.

**Either path:**
- Add a small "Last demo reset: `<timestamp>`" line in the dashboard footer (visible only to the demo developer) so it's clear when the state was last clean.

**Acceptance:** After deliberately corrupting demo state (create 5 junk levels, delete Level 03, rename Level 01), running the reset restores the library to exactly 8 canonical levels with their original content. The reset runs automatically without manual intervention.

### 0.6 Production hardening for the demo path

Small guards so the now-public demo experience can't be abused:

- The demo login endpoint must check both the feature flag AND that the demo user actually exists in the database — return 404 if either condition fails. This prevents accidental enablement in environments without seed data.
- The Anthropic API integration is now reachable by any visitor through the AI Generator. Add a per-IP rate limit on the generation endpoint: **10 generations per hour per IP**. Use the same rate limiter middleware from 0.2.
- Set a hard monthly budget cap on the Anthropic account (configurable in the Anthropic console) so a runaway bot can't generate a surprise bill. Document the cap value in `DESIGN.md` and put a note in the README about the demo's expected cost ceiling.
- Make sure the Anthropic API key is loaded from environment variables only — `grep -r "sk-ant" backend/` should return nothing in tracked files.

**Acceptance:** A scripted client hitting the AI generation endpoint in a tight loop gets HTTP 429 after the hourly cap. The Anthropic console shows a configured monthly budget limit. No API key appears in source.

---

### Phase 0 — overall success criteria

A recruiter who has never seen this project can:

1. Visit the root URL.
2. Click "Tour the developer dashboard."
3. Land on the fully-authenticated dashboard in under 3 seconds total.

From the dashboard, the AI Generator is one more click. **URL → AI Generator in 2 clicks** is the headline metric for this phase.

The demo state remains clean indefinitely without manual intervention. The AI generation endpoint can't be exploited for runaway costs. The regular login flow still works exactly as it did before — Phase 0 is purely additive.

---

## Phase 1 — Foundations

### 1.1 Unified color system

Today the dashboard uses a blue primary and the game uses a purple/indigo primary. They look like two separate products. Consolidate.

**Decision:** Adopt the game's purple/indigo (~`#6366F1`) as the single primary color across the entire product. Keep neutral grays for chrome. Status colors (green for published, red for destructive, yellow/amber for medium difficulty, etc.) stay.

**Action:**
- Define design tokens in one place. For React, use CSS custom properties on `:root` or extend the existing Tailwind config — whichever pattern is already in use. Don't introduce a second styling system.
- Suggested token set (light theme for dashboard, dark theme for game):
  - `--color-primary: #6366F1`
  - `--color-primary-hover: #4F46E5`
  - `--color-success: #10B981`
  - `--color-danger: #EF4444`
  - `--color-warning: #F59E0B`
  - `--color-info: #3B82F6`
  - Surface and text tokens for both light and dark modes
- Replace hardcoded hex values throughout the React app with tokens.
- For canvas drawing code, CSS variables don't work directly. Read them once at game load via `getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()` and cache in a constants module.
- Create a short `DESIGN.md` at the repo root documenting the palette and the rationale.

**Acceptance:** Every "primary action" button across dashboard and game uses the same purple. No raw hex literals exist outside the tokens file. `grep` for `#[0-9A-Fa-f]{3,6}` in `src/` returns only the tokens file (and comments).

### 1.2 Fix the "Validated: 0" stat

Both the dashboard and the reports page prominently display **Validated: 0**, which reads as "this feature is broken" in any screenshot.

Investigate first: is "Validated" a real workflow with a UI to validate levels, or a vestigial column?

- **If it's real:** validate at least 5 of the 8 seed levels using the existing validation flow. The KPI should read something like 5 or 6 in screenshots.
- **If it's vestigial or low-value:** replace the KPI card with something meaningful — `Total game objects` (sum across levels), `Avg objects per level`, or `Levels played this week`. Pick whatever is cheapest to compute from existing data.

**Acceptance:** No prominent zero-value KPI exists on the dashboard or reports page in fresh screenshots.

---

## Phase 2 — Game UI polish (highest portfolio impact)

This is where most recruiter attention will land. The dashboard is already strong; the game side is the weakest link in the screenshots.

### 2.1 Main menu — bring it to life

Currently a wordmark and four buttons on flat dark blue. Needs to feel like a game.

**Implementation:**
- Use the existing in-game parallax skyline as the menu background. Three layers minimum, drifting horizontally at different speeds (e.g., far layer ~5 px/s, mid ~15 px/s, near ~30 px/s). Driven by `requestAnimationFrame`, paused when tab is hidden.
- Place an animated squid sprite on the menu — sitting on a small platform off to the side, looping the existing idle animation. Reuse existing sprite frames; do not produce new art.
- A subtle stars-twinkling effect (random opacity oscillation across ~10 star elements over a 2-3s period) is a nice cheap polish add.
- The menu buttons themselves are fine — leave the layout, just retheme to use the new tokens.

**Acceptance:** Loading the main menu shows continuous, smooth motion. The squid is idle-animating. Frame rate stays at 60fps on a mid-range laptop. Buttons remain readable against the moving background (add a soft vignette or a translucent panel behind the button column if needed).

### 2.2 Level Select — fill the void, add information density

Currently a single card floating in dark space with locked levels nearly invisible.

**Implementation:**
- Reuse the same parallax skyline background as the main menu. Consistency between menu screens reads as intentional design.
- Vertically center the level grid card; increase its size so it's the clear focus of the screen.
- **Locked state contrast fix:** locked level cards currently disappear into the background. Bump their opacity to about 0.5, make the padlock icon visibly white (not dim purple), and keep the difficulty label readable.
- **Level thumbnails (highest impact addition):** render a tiny preview of each level's grid using the actual level data. Build a `<LevelThumbnail level={level} />` component:
  - Internal canvas at 80×60 px (or whatever fits the card).
  - Just colored squares for keys, barriers, hazards, and exit. Skip platforms or render them as a single shared bg color.
  - Memoize on `level.id + level.updatedAt`.
- **Best time + completion star:** for completed levels, show a small ★ in the top-right of the card and the best time below the level number (e.g., `Best: 00:24`). Pull from the existing scores endpoint.

**Acceptance:** Level select becomes the most information-dense, visually interesting screen in the game. A recruiter can see at a glance which levels are easy/medium/hard, completed/locked, and roughly what each level's layout looks like.

### 2.3 Game canvas — replace flat rectangles with real art

The most-screenshotted screen and the one that currently looks most like a prototype. Order of operations matters because barrier art and HUD upgrades give the biggest visual lift per hour.

**1. Barrier art (do this first).** Each colored barrier currently renders as a flat translucent rectangle with placeholder text inside. Replace with an animated energy field:
   - Vertical or diagonal gradient in the barrier's color
   - Scrolling stripe pattern offset by `Date.now() / 60` to give continuous motion
   - Subtle glow via `ctx.shadowColor` and `ctx.shadowBlur`
   - Top and bottom "cap" lines in a brighter shade of the same color
   - Apply per color: red, blue, green, yellow, purple, white

**2. Platform tiles.** Two options, pick whichever fits time/skill comfort:
   - **Easier:** Use [Kenney.nl](https://kenney.nl)'s free CC0 platformer tile packs. Pick a set that matches the dark/space theme. Slice into top-edge, fill, and side tiles. Apply 9-slice or just tile + edges.
   - **More impressive:** Draw platforms procedurally — a 1-2px top edge in the primary purple, a darker fill below, a 1px inner shadow at the bottom for depth.

**3. Hazards.** Spikes should actually look like spikes (a row of triangles, dark with a metallic gradient on the top face). Kill bricks should look visibly distinct from regular platforms — a hazard-stripe pattern (yellow/black diagonal stripes) is the standard.

**4. HUD upgrade.** Current top bar reads `Level 01  00:04  Keys 0/2`. Replace `Keys 0/2` with a row of small key icons — one icon per key in the level, colored if not yet collected, faded gray if collected. Players see at a glance which colors they still need. Keep level name and timer text. Style with the new tokens.

**5. Particle burst on key collect.** When a key is collected, spawn ~12 particles in the key's color at the key's position. Each particle: random outward velocity, slight downward gravity, fades over ~600ms. Pure canvas, no library. Same effect (white particles) when the player touches the exit door.

**Acceptance:** A 10-second gameplay clip looks obviously polished, not prototype-y. A still screenshot mid-play is visually compelling without needing context.

### 2.4 Level complete screen — game-feel touches

Mostly fine. Two specific changes.

**Implementation:**
- Show **previous best time** below the current completion time in a smaller, dimmer font (e.g., `Best: 00:18`).
- If the just-completed run beat the previous best, show an animated teal `★ New best!` callout above the time. Use a CSS keyframe animation — fade-in + slight scale bounce.
- **Remove the keyboard hints** (`← → Move  Space / ↑ Jump  Esc Pause`) from this screen. They belong only on the gameplay screen, ideally only briefly on first launch or behind a `?` help toggle.

**Acceptance:** Beating your own time feels rewarding. The completion screen is uncluttered.

---

## Phase 3 — Dashboard refinements

### 3.1 Action buttons → kebab menu

The Level Management table currently has three text-link action buttons per row (Edit / Unpublish / Delete). Across 8 rows that's 24 small clickable elements competing for attention.

**Implementation:**
- Replace per-row action buttons with a single kebab (`⋯`) icon button that opens a small dropdown containing Edit, Unpublish/Publish, Delete.
- Keep keyboard accessibility: focus trap inside the dropdown, Esc closes it, arrow keys navigate items.
- "Delete" should still trigger the existing confirm dialog.

**Acceptance:** The level management table feels lighter. All actions remain reachable in one extra click. Keyboard navigation works.

### 3.2 Reports — add at least one chart

The reports page is impressive (KPIs + filters + table) but has no visualization. One chart unlocks the screenshot.

**Implementation:**
- Add a single bar chart: **Levels by difficulty**. Three bars (Easy / Medium / Hard), colored to match the difficulty badges in the table.
- Library: Recharts if it's already a dependency or already used elsewhere. If not, install it (only new dependency this prompt allows).
- Place the chart between the KPI strip and the data table.
- The chart must respect active filters — when the user filters by date range or status, the chart updates with the table.

**Acceptance:** Reports page screenshot now contains a clear data visualization. Filter changes update both the chart and the table.

### 3.3 AI Generator — close the loop

After generating a level, the only action today is "Save to library." The user has to navigate elsewhere to play it.

**Implementation:**
- Add a third button: **Save & playtest**. It saves the level to the DB and immediately routes to the player game with that level loaded (introduce a route param like `?level=<id>&from=ai-generator`).
- After playtest completes (level beaten or user exits), return to the generator page with the previous constraint inputs preserved so iteration is fast.
- Keep the existing "Save to library" and "Regenerate" buttons.

**Acceptance:** The generate → playtest → tweak → regenerate loop takes under 30 seconds.

---

## Phase 4 — Brand polish

### 4.1 Squid mascot, more visible

The squid is a real differentiator (matches the user's GitHub handle, GreySquiid Studios) and is currently underused.

**Implementation:**
- Add the squid (small, idle-animating where movement makes sense, static PNG where it doesn't) to:
  - Main menu — already covered in 2.1
  - Level Select header — small, just the sprite
  - Empty states — e.g., "No levels match your search" on Level Management → squid + message
  - The 404/error boundary page
- Use a static PNG export of the sprite where animation would be overkill or distracting (empty states, 404).

### 4.2 Loading and empty states

Wherever the React app currently shows a generic spinner or blank section while data loads, replace with a small branded loading state — squid sprite + a short label like "Loading levels…". This is a small touch that disproportionately reads as "polished product" in screen recordings.

---

## What NOT to do

- Don't introduce new state management (Redux, Zustand, Jotai, etc.) — work with what's there.
- Don't rewrite the canvas game in a game engine (Phaser, PixiJS, etc.). Polish the existing implementation.
- Don't add npm packages other than Recharts (and only if it isn't already there). If you find yourself wanting another dependency, ask first.
- Don't change existing auth, security, or DB schema. The only auth additions allowed are the demo-login endpoint (0.2) and rate limiting (0.2/0.6) — the regular login/registration/JWT flow stays untouched and must keep working exactly as it does today.
- Don't change existing API contracts. New endpoints from Phase 0 are fine. If you need new data on the frontend (e.g., best times for level select cards) and an endpoint doesn't exist, surface the gap and ask before adding one.
- Don't remove the existing `/login` route or normal credentialed login flow — Phase 0 is purely additive. Visitors who prefer to type credentials must still be able to.
- Don't gold-plate. If a phase is "good enough," move on. Coverage across all phases matters more than perfection in any one.
- Don't break existing tests. All 22 xUnit tests must still pass after each phase.
- Don't commit secrets. The Anthropic API key, JWT secret, and DB connection string stay in environment variables.

---

## Definition of done — per phase

Before moving to the next phase:

1. Code committed with a descriptive message referencing the phase number.
2. `dotnet test` passes (22/22).
3. `npm run build` (or whatever the frontend build is) completes without new warnings introduced by your changes.
4. Manual smoke test as the demo developer covers every screen touched in the phase.
5. Take fresh screenshots of any changed screens and save them to `/screenshots/portfolio/<phase>-<screen>.png`.

---

## Final deliverable

After all phases, produce a closeout summary:

- A `CHANGES.md` listing what changed file-by-file across the pass.
- A list of fresh screenshots taken, organized by phase.
- Recommended display order for the portfolio README, prioritizing the most differentiated work first:
  1. Landing page (the new front door — establishes the project at a glance)
  2. AI Generator (most differentiated technical work)
  3. Game canvas mid-play (now polished)
  4. Level Management (kebab menu, clean table)
  5. Reports with chart
  6. Level Select with thumbnails
  7. Main Menu (animated, squid present)
- Any TODOs or known issues that surfaced during implementation but were out of scope.
- A 60-second demo video would be the natural next step after this work — note any scenes the new screens enable (e.g., "AI generates a level → save & playtest → complete → leaderboard updates").

---

## First step

Once you've read this document, respond with:

1. A summary of the project structure as you understand it from the codebase.
2. Any clarifying questions about the prompt — especially around how routing is currently set up (Phase 0 changes the root route, so understanding the existing router is important).
3. Your proposed plan for Phase 0 — files you'll touch, in what order, and which of the two demo-reset paths in 0.5 you recommend given the deployment setup.

Then wait for go-ahead before writing code.

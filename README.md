# 🦑 Unlock The Room

> An AI-assisted puzzle platformer with a full-stack developer management suite — originally built as the WGU D424 Software Engineering Capstone for GreySquiid Studios.

**[▶ Play the live demo](https://unlock-the-room-frontend-production.up.railway.app)** · **[Developer Dashboard](https://unlock-the-room-frontend-production.up.railway.app/dashboard)**

---

![Gameplay Demo](docs/gameplay-demo.gif)
> *Collect color-coded keys, unlock barriers, and reach the exit — levels designed by humans and AI alike.*

---

## What is this?

Unlock The Room is a browser-based puzzle platformer where players navigate grid-based levels, collecting keys that unlock color-matched barriers blocking the path to the exit door. The twist: levels can be designed by a developer using a built-in grid editor **or generated from scratch using the Anthropic Claude API**, which produces playable, logically consistent puzzles based on developer-supplied constraints.

The project ships with two interfaces — a dark-themed HTML5 Canvas game for players, and a React management dashboard for developers to create, publish, validate, and analyze levels.

---

## Features

- 🎮 **Browser-based puzzle platformer** — 60fps HTML5 Canvas game loop with sprite animation, physics, and collision
- 🤖 **AI-powered level generation** — Anthropic Claude API produces playable, validated levels from developer constraints
- 🛠 **Drag-and-drop level editor** — live grid preview, object rotation, publish/validate toggling, reorderable level library
- 🔐 **Role-based authentication** — JWT tokens (HMAC-SHA256) + BCrypt password hashing, Developer vs Player permissions
- 📊 **Developer dashboard** — level management, reports, live stats, and AI generator in a single React SPA
- ✅ **22 xUnit tests** — service layer coverage with in-memory EF Core databases, 100% pass rate
- 🐳 **Dockerized deployment** — multi-stage builds for both API and frontend, auto-deployed via Railway on push to main

---

## Tech Stack

| Layer | Technology |
|---|---|
| Back-end API | ASP.NET Core Web API (.NET 8, C#) |
| Front-end | React 18 (JavaScript) |
| Game Engine | HTML5 Canvas API |
| Database | PostgreSQL 16 + Entity Framework Core 8 |
| AI Generation | Anthropic API (claude-haiku-4-5-20251001) |
| Authentication | JWT Bearer tokens + BCrypt password hashing |
| Deployment | Docker + Railway.app (CI/CD on push to main) |
| Testing | xUnit + EF Core InMemory + Moq |

---

## Architecture

```
Browser
├── /game          → React game client (HTML5 Canvas, 60fps game loop)
│    ├── Main Menu, Level Select, Settings, Saved Levels
│    └── GameCanvas — physics, collision, sprite animation, HUD
└── /dashboard     → React management dashboard (Developer role only)
     ├── Level Management — CRUD, reorder, publish, validate
     ├── Level Editor — drag/drop grid editor with rotation support
     ├── AI Generator — Anthropic API → JSON level → grid preview
     └── Reports — level inventory with filters and timestamps

ASP.NET Core Web API (port 5050 local / 8080 production)
├── Controllers: Levels, Users, Reports, Ai, Scores, SavedLevels
├── Services: business logic layer, cascade deletes, score formatting
├── Models: GameObject (abstract) → Key, Barrier, Button, Hazard, ExitDoor
└── EF Core TPH: all 5 game object types in one GameObjects table

PostgreSQL
└── Tables: Levels, Users, GameObjects, Scores, SavedLevels
```

---

## OOP Design Highlights

- **Inheritance** — `GameObject` abstract base class with 5 concrete child types
- **Polymorphism** — abstract `GetObjectDescription()` overridden per type
- **Encapsulation** — all state transitions (key collection, barrier unlock, level validation) managed through the service layer
- **Table Per Hierarchy** — EF Core maps all 5 game object types to a single `GameObjects` table using an `ObjectType` discriminator column

---

## Running Locally

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js 20+](https://nodejs.org)
- [PostgreSQL 16](https://www.postgresql.org/download/)
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone the repo

```bash
git clone https://gitlab.com/wgu-gitlab-environment/student-repos/jda1011/d424-software-engineering-capstone.git D424
cd D424
```

### 2. Set up the database

```bash
psql postgres -c "CREATE DATABASE unlocktheroom;"
psql postgres -c "CREATE USER postgres WITH PASSWORD 'postgres';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE unlocktheroom TO postgres;"
psql postgres -c "ALTER DATABASE unlocktheroom OWNER TO postgres;"
```

### 3. Configure the API

Create `backend/UnlockTheRoom.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=unlocktheroom;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "UnlockTheRoom",
    "Audience": "UnlockTheRoom"
  },
  "Anthropic": {
    "ApiKey": "your-anthropic-api-key",
    "Model": "claude-haiku-4-5-20251001"
  }
}
```

> ⚠️ `appsettings.json` is gitignored — never commit API keys.

### 4. Run the API

```bash
cd backend/UnlockTheRoom.API
dotnet ef database update
dotnet run
# API running at http://localhost:5050
# Swagger UI at http://localhost:5050/swagger
```

### 5. Run the React UI

```bash
cd frontend/unlock-the-room-ui
npm install
npm start
# App running at http://localhost:3000
```

---

## Running Tests

```bash
cd backend/UnlockTheRoom.Tests
dotnet test --logger "console;verbosity=detailed"
```

**22 tests — 100% pass rate.** Covers `UserService` (auth, registration, email normalization), `LevelService` (CRUD, search, filtering), and `ScoreService` (submission, leaderboard ordering, ownership).

---

## Deploying with Docker

Both services include production Dockerfiles using multi-stage builds.

```bash
# Build API image
cd backend/UnlockTheRoom.API
docker build -t unlocktheroom-api .

# Build frontend image
cd frontend/unlock-the-room-ui
docker build -t unlocktheroom-ui .
```

Production deployment is automated — pushing to the `main` branch of the GitHub mirror triggers Railway to rebuild and redeploy both containers automatically.

---


## Project Structure

```
D424/
├── backend/
│   ├── UnlockTheRoom.API/
│   │   ├── Controllers/
│   │   ├── Data/           # AppDbContext, TPH configuration
│   │   ├── DTOs/
│   │   ├── Migrations/
│   │   ├── Models/         # GameObject (abstract) + 5 child classes
│   │   ├── Services/
│   │   ├── Dockerfile
│   │   └── Program.cs
│   └── UnlockTheRoom.Tests/
│       ├── Helpers/        # TestDbContextFactory
│       ├── UserServiceTests.cs
│       ├── LevelServiceTests.cs
│       └── ScoreServiceTests.cs
└── frontend/
    └── unlock-the-room-ui/
        ├── public/assets/  # squid-sprite.png, utr-bg.png
        ├── src/
        │   ├── components/
        │   │   ├── LevelEditor.js
        │   │   └── game/   # GameCanvas, MainMenu, LevelSelect, etc.
        │   ├── pages/      # Dashboard, Levels, Reports, AiGenerator, Game
        │   └── services/
        │       └── api.js
        ├── Dockerfile
        └── nginx.conf
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready |
| `develop` | Integration branch |
| `feature/*` | One branch per sprint feature |

---

## License

Originally built as the WGU D424 Software Engineering Capstone (2026). © GreySquiid Studios · Joshua Davidson.

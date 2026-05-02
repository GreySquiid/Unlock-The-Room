# Local Setup

Full guide for running Unlock The Room locally — database, API, frontend, tests, and Docker.

For project overview, architecture, and engineering decisions, see [README.md](README.md). For design tokens and the color system, see [DESIGN.md](DESIGN.md).

---

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js 20+](https://nodejs.org)
- [PostgreSQL 16](https://www.postgresql.org/download/)
- An [Anthropic API key](https://console.anthropic.com) (only required for the AI level generator)

---

## 1. Clone the repo

```bash
git clone https://github.com/GreySquiid/Unlock-The-Room.git
cd Unlock-The-Room
```

---

## 2. Set up the database

```bash
psql postgres -c "CREATE DATABASE unlocktheroom;"
psql postgres -c "CREATE USER postgres WITH PASSWORD 'postgres';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE unlocktheroom TO postgres;"
psql postgres -c "ALTER DATABASE unlocktheroom OWNER TO postgres;"
```

---

## 3. Configure the API

The committed `appsettings.json` contains only non-secret defaults — secrets live in `appsettings.Development.json` (gitignored) for local dev, or environment variables in production.

Create `backend/UnlockTheRoom.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=unlocktheroom;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!"
  },
  "Anthropic": {
    "ApiKey": "your-anthropic-api-key"
  }
}
```

> ⚠️ `appsettings.Development.json` is gitignored. Never commit secrets.

---

## 4. Run the API

```bash
cd backend/UnlockTheRoom.API
dotnet ef database update
dotnet run
```

- API: `http://localhost:5050`
- Swagger UI: `http://localhost:5050/swagger`

---

## 5. Run the React UI

In a second terminal:

```bash
cd frontend/unlock-the-room-ui
npm install
npm start
```

- App: `http://localhost:3000`

The dev server proxies API calls to `http://localhost:5050` per `package.json`.

---

## Demo account

After running database migrations, the seed data creates a Developer account you can use to access the dashboard:

- **Email:** `demo@greysquiid.com`
- **Password:** `Demo@2026!`

Or visit `http://localhost:3000` and click **Tour the developer dashboard** for one-click demo login.

---

## Running tests

```bash
cd backend/UnlockTheRoom.Tests
dotnet test --logger "console;verbosity=detailed"
```

24 xUnit tests covering the service layer (`UserService`, `LevelService`, `ScoreService`, `DemoLogin`). Each test runs against a fresh in-memory EF Core database.

---

## Demo data reset

The API runs a `DemoResetService` background job that restores the level library to a known-good state every 24 hours (configurable via `DemoReset:IntervalHours` in `appsettings.json`). The canonical state is stored in `backend/UnlockTheRoom.API/SeedData/canonical-levels.json`.

This means anything visitors create, edit, or delete on the live demo gets cleaned up automatically.

To reset locally, restart the API — the reset fires 10 seconds after startup and then on the configured interval.

---

## Building Docker images

Both services include production Dockerfiles using multi-stage builds.

```bash
# Build API image
cd backend/UnlockTheRoom.API
docker build -t unlocktheroom-api .

# Build frontend image
cd frontend/unlock-the-room-ui
docker build -t unlocktheroom-ui .
```

Production deployment is automated — pushing to `main` on the GitHub mirror triggers Railway to rebuild and redeploy both containers.

---

## Production environment variables

For Railway (or any production deployment), set the following env vars instead of using `appsettings.Development.json`. Railway converts `__` (double underscore) into the `:` separator that .NET configuration uses for nested keys.

| Variable | Purpose |
|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `Jwt__Key` | JWT signing key (32+ chars) |
| `Anthropic__ApiKey` | Anthropic API key for AI level generation |
| `ASPNETCORE_URLS` | Bind address (e.g., `http://*:8080`) |

`Jwt__Issuer`, `Jwt__Audience`, `Anthropic__Model`, `Features__DemoLogin`, and `Features__DemoEmail` have non-secret defaults in `appsettings.json` — override only if needed.

---

## Troubleshooting

**`appsettings.json` not picked up in Docker**
The root `.dockerignore` previously excluded `appsettings.json`, which caused production deployments to ship without the `Features` block. Confirmed fixed — `appsettings.json` is included in the build context, and only `appsettings.Development.json` is excluded.

**Migrations fail with "relation does not exist"**
Run `dotnet ef database update` from `backend/UnlockTheRoom.API/`. EF Core needs the migrations to be applied before the API can start.

**Anthropic API returning 401 / 403**
Check that `Anthropic__ApiKey` is set correctly. The API will start without it, but `/api/Ai/generate-preview` will fail at request time.

**Rate limit hit while testing**
Two rate limits exist: `demo-login` (30 req/min per IP) and `ai-generate` (10 req/hour per IP). Both are configured in `Program.cs` via `AddRateLimiter`. If you're hitting either during local development, restart the API to reset the counters.

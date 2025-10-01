# Cubing Results Aggregator - Development Guide

## Project Overview

This is a cubing (Rubik's Cube speedsolving) results aggregation system that imports and aggregates competition data from the World Cube Association (WCA). The project is a **Yarn v1 monorepo** using **Turborepo** for build orchestration, with TypeScript, Node.js, Prisma ORM, PostgreSQL database, and Express.js API.

**Project Size**: ~20 source files across 2 apps and 4 packages
**Runtime**: Node.js (target: current/ESNext)
**Languages**: TypeScript, JavaScript
**Database**: PostgreSQL (via Prisma ORM)
**Package Manager**: Yarn 1.22.22 (specified in package.json)

## Repository Structure

```
/
├── apps/
│   └── api/                    # Express.js REST API server
│       ├── controllers/        # API controllers
│       ├── routes/            # API routes (v0 versioned)
│       ├── middlewares/       # Express middlewares
│       ├── index.ts           # Server entry point (port 8080)
│       ├── app.ts             # Express app setup
│       ├── db.ts              # Prisma client instance
│       ├── package.json       # Scripts: dev, start, lint
│       ├── eslint.config.mjs  # ESLint config
│       └── tsconfig.json      # TypeScript config
│
├── packages/
│   ├── datasources/
│   │   ├── WCA/              # WCA API client (@datasources/wca)
│   │   │   ├── WcaApi.ts    # HTTP client for WCA API
│   │   │   ├── types.ts     # Type definitions
│   │   │   └── package.json
│   │   └── WcaLive/         # WCA Live API client (@datasources/wca-live)
│   │
│   └── import/               # Import logic (@packages/import)
│       ├── importers/       # Data import strategies (fromWcif, fromWca, fromWcaLive, etc.)
│       ├── lib/             # Shared utilities (db.ts, helpers.ts, rounds.ts, etc.)
│       ├── scripts/         # Utility scripts (fetchWCA.ts)
│       ├── tests/           # Jest tests
│       ├── package.json     # Scripts: lint, test
│       ├── jest.config.ts   # Jest config (empty file)
│       ├── babel.config.mjs # Babel config for Jest
│       └── eslint.config.mjs
│
├── prisma/
│   ├── schema.prisma        # Database schema (PostgreSQL)
│   └── seed.ts             # Database seeding script
│
├── .husky/                 # Git hooks
│   ├── pre-commit          # Runs prettier on commit
│   └── pre-push            # Runs turbo lint before push
│
├── package.json            # Root workspace config
├── turbo.json             # Turborepo task config
├── docker-compose.yml     # Database services (PostgreSQL on 5433, MySQL on 3306)
├── .env.test              # Test environment config
└── yarn.lock
```

## Build & Development Commands

### Installation & Setup

**ALWAYS run these commands in this exact order:**

1. **Install dependencies** (always first step):

   ```bash
   yarn install
   ```

   - Takes ~40 seconds
   - Installs all workspace dependencies
   - Automatically runs `prisma generate` via postinstall hook
   - Automatically sets up husky git hooks

2. **Start the database** (required for tests and running the API):

   ```bash
   docker compose up -d db
   ```

   - Starts PostgreSQL on port 5433 (user: user, password: password, db: db)
   - Use `docker compose down` to stop
   - Note: Uses `docker compose` (with space), not `docker-compose`

3. **Initialize database schema** (required after starting db):
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5433/db" yarn prisma db push
   ```
   - Pushes Prisma schema to database
   - **IMPORTANT**: Prisma CLI commands require network access to download query engine binaries
   - If network access is restricted, Prisma commands will fail with "ENOTFOUND binaries.prisma.sh"
   - The Prisma client is generated during `yarn install`, but CLI tools may not work without network access

### Linting

```bash
yarn lint
```

- Runs ESLint across all packages via Turborepo
- Takes ~1.7 seconds (cached: 58ms)
- Lints: @apps/api, @packages/import (datasource packages have no lint script)
- **ALWAYS run this before committing** (enforced by pre-push hook)

### Building

```bash
yarn build
```

- Currently a no-op (no packages define build tasks)
- TypeScript files are run directly via `tsx` (apps/api) or transpiled via Babel/Jest (packages/import)
- Takes ~50ms

### Testing

**Test the import package:**

```bash
cd packages/import
yarn test
```

- Runs Jest with `-i` flag (run tests serially)
- Uses Babel for TypeScript transpilation
- **IMPORTANT**: Tests require a working Prisma client
- If tests fail with "@prisma/client did not initialize yet", run `yarn prisma generate` first
- Test database URL is configured in `.env.test`: `postgresql://prisma:prisma@localhost:5433/tests`

### Running the API Server

**Development mode** (with watch and debug):

```bash
cd apps/api
yarn dev
```

- Runs on port 8080 with `tsx --inspect --watch`
- Auto-reloads on file changes
- Debug port: 9229 (see .vscode/launch.json for debugging config)

**Production mode**:

```bash
cd apps/api
yarn start
```

- Runs on port 8080 with `tsx`
- Requires DATABASE_URL environment variable

### Formatting

**Auto-format all files** (runs on pre-commit hook):

```bash
yarn prettier --write . --log-level warn
```

- No specific prettier config file (uses defaults)
- Formats TypeScript, JavaScript, JSON, Markdown files

## Database & Prisma

### Schema Location

- **Schema file**: `prisma/schema.prisma`
- **Generator**: Prisma Client for TypeScript
- **Provider**: PostgreSQL
- **Main models**: Person, Competition, Result, Round, Registration, Record, Country, Continent, Event
- **Enums**: RoundType, ResultSource, RegistrationStatus, RecordType, RegionType

### Prisma Commands

**Generate Prisma Client** (after schema changes):

```bash
yarn prisma generate
```

- **REQUIRES NETWORK ACCESS** to download query engine binaries
- Automatically runs during `yarn install`
- May fail in restricted network environments

**Push schema to database**:

```bash
DATABASE_URL="postgresql://user:password@localhost:5433/db" yarn prisma db push
```

- **REQUIRES NETWORK ACCESS** to download query engine binaries
- Use for development (no migrations)

**Seed database**:

```bash
yarn prisma db seed
```

- Runs `prisma/seed.ts` using `tsx`
- Seeds continents and countries from WCA API

### Database Access in Code

**Import Prisma client**:

```typescript
// In apps/api
import { prismaClient } from "./db";

// In packages/import
import { prisma } from "./lib/db";

// Both export a configured PrismaClient instance
```

## Pre-commit Checks

The repository uses **Husky** for Git hooks:

1. **pre-commit** (`.husky/pre-commit`):

   ```bash
   yarn prettier --write . --log-level warn
   git update-index --again
   ```

   - Auto-formats all changed files
   - Takes a few seconds

2. **pre-push** (`.husky/pre-push`):
   ```bash
   yarn turbo lint
   ```
   - Lints all packages
   - Fails push if linting errors exist

## Common Issues & Workarounds

### Issue: Prisma Client Not Initialized

**Error**: `@prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.`

**Cause**: Prisma client wasn't generated or is out of sync

**Solution**: Run `yarn prisma generate` (requires network access) or `yarn install` to regenerate

### Issue: Tests Fail with Database Connection Error

**Cause**: PostgreSQL database not running or wrong connection URL

**Solution**:

1. Start database: `docker compose up -d db`
2. Verify connection: `postgresql://user:password@localhost:5433/db`
3. Check port 5433 is not in use
4. Run `yarn prisma db push` to initialize schema

### Issue: Prisma Commands Fail with Network Error

**Error**: `getaddrinfo ENOTFOUND binaries.prisma.sh`

**Cause**: Prisma CLI cannot download query engine binaries

**Workaround**:

- Prisma client is generated during `yarn install` and should work for TypeScript imports
- CLI commands (`prisma db push`, `prisma generate`) require network access and may not work
- If working in a restricted environment, document this limitation

### Issue: Port 5433 Already in Use

**Cause**: Another PostgreSQL instance or previous container still running

**Solution**:

1. Stop containers: `docker compose down`
2. Kill process on port: `lsof -ti:5433 | xargs kill -9`
3. Restart: `docker compose up -d db`

## Key Facts for Code Changes

### TypeScript Configuration

- Target: ESNext
- Module: CommonJS (apps/api), ES modules supported
- Strict mode enabled
- No emit in most packages (tsx or Babel handle transpilation)
- Path aliases: `@/controllers/*` in apps/api, `@datasources/wca`, `@packages/import`, etc.

### ESLint Configuration

- Uses ESLint 9 with flat config (eslint.config.mjs)
- TypeScript support via typescript-eslint
- Jest plugin in packages/import for test files
- Rules: Focused on code quality, no disabled tests, no focused tests

### Testing Setup

- Framework: Jest 29
- Transpiler: Babel with @babel/preset-env and @babel/preset-typescript
- HTTP mocking: nock for WCA API calls
- Database: Uses real Prisma client (not mocked)
- Test files: `*.spec.ts` pattern

### Workspace Dependencies

Internal packages reference each other via workspace protocol:

- `@datasources/wca` - WCA API client
- `@datasources/wca-live` - WCA Live API client
- `@packages/import` - Import logic
- `@apps/api` - API server

### API Structure

- Base path: `/api`
- Versioned routes: `/api/v0/results`
- Controllers pattern: Separate business logic from routes
- Middleware: Error handling via errorHandler
- Request logging: Morgan (tiny format)
- Validation: express-validator and zod

## Quick Reference

**Start fresh development environment:**

```bash
yarn install
docker compose up -d db
DATABASE_URL="postgresql://user:password@localhost:5433/db" yarn prisma db push
yarn lint
```

**Run tests:**

```bash
docker compose up -d db
cd packages/import && yarn test
```

**Start API server:**

```bash
docker compose up -d db
cd apps/api && yarn dev
```

**Stop everything:**

```bash
docker compose down
```

## Important Notes

- **ALWAYS run `yarn install` first** after cloning or pulling changes
- **ALWAYS lint before committing** (enforced by pre-push hook, but save time by running early)
- **Database must be running** for tests and API to work
- **Prisma client is generated automatically** during yarn install, but CLI tools require network access
- **Use `docker compose`** (with space), not `docker-compose`
- **Port 5433 for PostgreSQL**, not the default 5432 (to avoid conflicts)
- **Trust these instructions** - they have been validated and tested. Only search for additional information if instructions are incomplete or incorrect.

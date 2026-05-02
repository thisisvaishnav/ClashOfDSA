# Contributing to DSA Dash
---

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

---

## Project Overview

DSA Dash is a real-time competitive DSA battle platform built as a **TurboRepo monorepo** with three main apps:

| App | Description | Port |
|-----|-------------|------|
| `apps/web` | Next.js frontend | 3000 |
| `apps/battle-engine` | Express + Socket.IO backend | 4000 |
| `apps/worker` | BullMQ background job processor | — |

Shared code lives in `packages/` (database client, types, UI components, queue config).

---

## Prerequisites

Make sure you have the following installed:

- **Node.js** >= 22
- **pnpm** >= 9.0.0 — `npm install -g pnpm`
- **PostgreSQL** — local install or a [Neon](https://neon.tech) account
- **Redis** — local install or a cloud Redis instance

---

## Local Setup

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/clashofdsa.git
cd clashofdsa
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Key variables to configure:

```env
NODE_ENV=development
SERVER_PORT=4000
CLIENT_URL=http://localhost:3000

DATABASE_URL="postgresql://user:password@localhost:5432/dsadash"
REDIS_URL="redis://localhost:6379"

BETTER_AUTH_SECRET="any-random-secret"
BETTER_AUTH_URL="http://localhost:4000"

NEXT_PUBLIC_API_URL="http://localhost:4000"

MATCH_DURATION_MINUTES=15
MATCH_QUESTIONS_COUNT=5
WORKER_CONCURRENCY=5
CODE_EXECUTION_TIMEOUT_MS=5000
```

### 4. Set up the database

```bash
cd packages/db

# Generate the Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed with sample data
pnpm db:seed

# (Optional) Open the GUI
npx prisma studio
```

### 5. Start the development servers

```bash
# From the project root — starts all apps in parallel
pnpm dev
```

Or run each app independently in separate terminals:

```bash
pnpm dev --filter=battle-engine   # Terminal 1
pnpm dev --filter=web             # Terminal 2
pnpm dev --filter=worker          # Terminal 3
```

---

## Project Structure

```
clashofdsa/
├── apps/
│   ├── web/                    # Next.js frontend (App Router)
│   │   ├── app/                # Pages & layouts
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # Utilities (socket, auth, api)
│   ├── battle-engine/          # Express + Socket.IO backend
│   │   └── src/
│   │       ├── config/         # Env, CORS, Socket.IO config
│   │       ├── core/           # DB client, Redis client, Socket manager
│   │       └── features/       # Feature modules (match, auth, chat, etc.)
│   └── worker/                 # BullMQ job processor
│       └── src/
│           ├── processors/     # Job processing logic
│           └── workers/        # Worker setup
└── packages/
    ├── db/                     # Prisma schema & client singleton
    ├── types/                  # Shared TypeScript types
    ├── queue/                  # Redis & BullMQ queue definitions
    ├── ui/                     # Shared React component library
    ├── eslint-config/          # Shared ESLint rules
    └── typescript-config/      # Shared tsconfig presets
```

### Feature module pattern

Each feature in `apps/battle-engine/src/features/` follows this structure:

```
features/<name>/
├── <name>.types.ts       # TypeScript interfaces
├── <name>.service.ts     # Business logic
├── <name>.controller.ts  # HTTP request handlers
├── <name>.routes.ts      # Express route definitions
├── <name>.socket.ts      # Socket.IO event handlers
└── <name>.validator.ts   # Zod input validation schemas
```

Follow this pattern when adding a new feature.

---

## Development Workflow

### Branching

Branch off from `main`. Use descriptive branch names:

```
feat/matchmaking-timeout
fix/elo-calculation-bug
chore/update-prisma
docs/contributing-guide
```

### Useful scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm format` | Format code with Prettier |
| `pnpm check-types` | TypeScript type checking |

**Database scripts** (run from `packages/db`):

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema directly (development only) |
| `pnpm db:seed` | Seed the database with sample data |
| `pnpm db:studio` | Open Prisma Studio |

### Making schema changes

1. Edit `packages/db/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>` from `packages/db`
3. Run `npx prisma generate` to update the client
4. Update any affected TypeScript types in `packages/types`

---

## Code Style

- **TypeScript** — all new code must be typed. Avoid `any`.
- **Prettier** — formatting is enforced. Run `pnpm format` before committing.
- **ESLint** — run `pnpm lint` and fix all errors before opening a PR.
- **Zod** — use Zod schemas for all user input and external data validation at feature boundaries.
- **No unused imports/variables** — keep code clean.

---

## Submitting Changes

1. Ensure your branch is up to date with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Run all checks:
   ```bash
   pnpm lint
   pnpm check-types
   pnpm build
   ```

3. Commit with a clear message describing **what** and **why**:
   ```
   feat: add match timeout handling for idle players
   fix: correct ELO delta calculation on draw
   chore: bump Prisma to 6.3.0
   ```



## Reporting Issues

Open a GitHub Issue and include:

- A clear description of the bug or feature request
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your environment (OS, Node version, pnpm version)
- Relevant logs or screenshots if applicable

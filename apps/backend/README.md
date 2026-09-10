# @robago/backend

Express 5 + TypeScript + Mongoose REST API implementing `robago-prd.md` §5/§6.

## Setup

```bash
cp .env.example .env    # then fill in real secrets and a real MONGO_URI
pnpm --filter @robago/shared build   # backend imports @robago/shared's compiled dist/
pnpm --filter @robago/backend dev    # tsx watch src/server.ts
```

## What's verified vs. not

This was built and tested in a sandbox with **no reachable MongoDB instance** (network
access there is restricted to package registries). So:

- **Verified for real:** `tsc -b` build, `eslint`, and a 25-test `vitest` suite covering
  everything that doesn't need a live DB — JWT sign/verify round-trips (including
  rejection of forged/expired tokens), bcrypt password hashing, the transaction
  quantity-delta math (`utils/transactionMath.ts`, the core rule from PRD §4.3), the
  `requireAuth`/`requireRole` middleware logic, and a `supertest` pass against the real
  Express app for every route that doesn't touch the database (health check, Zod
  validation-error shapes, 401 on missing auth). This process is exactly what caught a
  real bug: Zod v4 emits its own generic message for a genuinely *missing* JSON field
  before a `.min()` check ever runs, so `loginSchema` (and a few other required-ObjectId
  fields) needed an explicit `error` override to actually produce the PRD's field
  messages — see the git history / `packages/shared/src/schemas/*.ts` comments.
- **Not verified here, worth doing before deploy:** anything that touches Mongoose
  against a real database — model validation actually round-tripping, the
  dependency-checked deletes, the transaction service's `session.withTransaction`
  (which needs a **replica set**, not a standalone `mongod` — see `.env.example`), and
  end-to-end auth (login → protected route → refresh → logout) against real data.

## Auth flow

Access tokens are short-lived JWTs returned in the JSON body (frontend holds them in
memory, never `localStorage` — see `robago-prd.md` §0/§4 on why). Refresh tokens are
httpOnly cookies scoped to `/api/v1/auth` (`utils/cookies.ts`), rotated via
`POST /auth/refresh`. `User.tokenVersion` lets a passcode reset invalidate every
outstanding refresh token for that user in one update.

## Resource pattern

Warehouses, Suppliers, and Production Units share one generic CRUD implementation
(`services/taggedEntity.service.ts` + `routes/taggedEntity.routes.ts`) since their shape
is identical in `robago-prd.md` §5 — they're still three separate Mongo collections
(`models/taggedEntity.model.ts`), never merged, since a real-world party can be both a
Supplier and a Production Unit at once (§9.1).

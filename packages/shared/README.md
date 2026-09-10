# @robago/shared

Single source of truth for Robago Admin's domain model, shared between `apps/backend`
(Express request validation) and `apps/frontend` (React Hook Form `zodResolver`).

## Contents

- **`enums.ts`** — `UserRole`, `ProductType`, `Unit`, `TransactionType`, `TagColor`.
  These are `as const` object unions, **not** TypeScript `enum` declarations — the
  workspace's base tsconfig sets `erasableSyntaxOnly: true` (carried over from
  `regraft`'s `tsconfig.app.json`), which forbids real `enum` because it emits runtime
  code the compiler can't erase. Use `UserRole.Admin` for the value, `UserRole` for the
  type — same ergonomics as a TS enum, erasable-syntax compliant.
- **`schemas/`** — one Zod schema module per REST resource in `robago-prd.md` §6,
  implementing every field-level and cross-field validation rule from §8 that a
  stateless request-body schema *can* express. Two rules are documented as **not**
  expressible here because they require a database lookup the schema layer doesn't
  have access to:
  - Inventory's "supplier + alert threshold required only for RawMaterial products"
    (see `validateInventoryBusinessRules` in `inventory.schema.ts`, meant to be called
    from the backend service layer after the referenced product is fetched).
  - User's "duplicate phone number" check (see `DUPLICATE_PHONE_NUMBER_MESSAGE` in
    `user.schema.ts`, meant to back a Mongo uniqueness check / duplicate-key handler).

## Build

```bash
pnpm --filter @robago/shared build     # tsc -b → dist/
pnpm --filter @robago/shared dev       # tsc -b --watch
```

Both `apps/backend` and `apps/frontend` depend on this package via
`"@robago/shared": "workspace:*"` and import from its built `dist/` output (not `src/`
directly) — run the build (or `dev` watch mode) before/while working on either app.

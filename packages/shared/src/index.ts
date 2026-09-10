// src/index.ts
// @robago/shared — single source of truth for domain enums and Zod request/response
// schemas, consumed by both apps/backend (request validation) and apps/frontend
// (React Hook Form resolvers), per robago-prd.md §5/§6/§8.
export * from "./enums.js";
export * from "./schemas/index.js";

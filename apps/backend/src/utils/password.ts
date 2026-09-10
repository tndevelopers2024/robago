// src/utils/password.ts
//
// Uses bcryptjs (pure JS) rather than native `bcrypt` — avoids a node-gyp/native-toolchain
// build step in CI/deploy environments where one may not be available. Swap for `bcrypt`
// (same API shape) if native performance matters more than that portability in your deploy
// target; nothing else in the codebase depends on which implementation is used.
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}

// src/utils/password.test.ts
import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "./password.js";

describe("password utils", () => {
    it("hashes a password and verifies it against the correct plaintext", async () => {
        const hash = await hashPassword("000000");
        expect(hash).not.toBe("000000");
        await expect(comparePassword("000000", hash)).resolves.toBe(true);
    });

    it("rejects an incorrect plaintext against a real hash", async () => {
        const hash = await hashPassword("000000");
        await expect(comparePassword("111111", hash)).resolves.toBe(false);
    });

    it("produces a different hash each time (random salt)", async () => {
        const [a, b] = await Promise.all([hashPassword("000000"), hashPassword("000000")]);
        expect(a).not.toBe(b);
    });
});

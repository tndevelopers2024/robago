// src/utils/jwt.test.ts
import { describe, expect, it, vi, beforeAll } from "vitest";

// env.ts validates process.env at import time, so set required vars before any import
// that transitively pulls it in.
beforeAll(() => {
    process.env.MONGO_URI = "mongodb://localhost:27017/test";
    process.env.JWT_ACCESS_SECRET = "test-access-secret-1234567890";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890";
});

describe("jwt utils", () => {
    it("signs and verifies an access token round-trip", async () => {
        const { signAccessToken, verifyAccessToken } = await import("./jwt.js");
        const token = signAccessToken({ sub: "abc123", phoneNumber: "9500088697", role: "superadmin" });
        const payload = verifyAccessToken(token);
        expect(payload.sub).toBe("abc123");
        expect(payload.phoneNumber).toBe("9500088697");
        expect(payload.role).toBe("superadmin");
    });

    it("signs and verifies a refresh token round-trip", async () => {
        const { signRefreshToken, verifyRefreshToken } = await import("./jwt.js");
        const token = signRefreshToken({ sub: "abc123", tokenVersion: 3 });
        const payload = verifyRefreshToken(token);
        expect(payload.sub).toBe("abc123");
        expect(payload.tokenVersion).toBe(3);
    });

    it("rejects a token signed with a different secret", async () => {
        const jwt = (await import("jsonwebtoken")).default;
        const { verifyAccessToken } = await import("./jwt.js");
        const forged = jwt.sign({ sub: "x", phoneNumber: "1", role: "superadmin" }, "wrong-secret");
        expect(() => verifyAccessToken(forged)).toThrow();
    });

    it("rejects an expired access token", async () => {
        vi.useFakeTimers();
        const { signAccessToken, verifyAccessToken } = await import("./jwt.js");
        const token = signAccessToken({ sub: "abc123", phoneNumber: "1", role: "manager" });
        vi.advanceTimersByTime(1000 * 60 * 60); // well past the 15m default expiry
        expect(() => verifyAccessToken(token)).toThrow();
        vi.useRealTimers();
    });
});

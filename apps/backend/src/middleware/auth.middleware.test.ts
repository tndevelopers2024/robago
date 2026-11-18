// src/middleware/auth.middleware.test.ts
import { describe, expect, it, vi, beforeAll } from "vitest";
import type { Request, Response } from "express";

beforeAll(() => {
    process.env.MONGO_URI = "mongodb://localhost:27017/test";
    process.env.JWT_ACCESS_SECRET = "test-access-secret-1234567890";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890";
});

function mockReqRes(headers: Record<string, string> = {}) {
    const req = { headers, user: undefined } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();
    return { req, res, next };
}

describe("requireAuth", () => {
    it("rejects a request with no Authorization header", async () => {
        const { requireAuth } = await import("./requireAuth.js");
        const { req, res, next } = mockReqRes();
        requireAuth(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0]![0];
        expect(err.statusCode).toBe(401);
    });

    it("rejects a malformed Authorization header (no Bearer prefix)", async () => {
        const { requireAuth } = await import("./requireAuth.js");
        const { req, res, next } = mockReqRes({ authorization: "sometoken" });
        requireAuth(req, res, next);
        const err = next.mock.calls[0]![0];
        expect(err.statusCode).toBe(401);
    });

    it("accepts a valid token and populates req.user", async () => {
        const { signAccessToken } = await import("../utils/jwt.js");
        const { requireAuth } = await import("./requireAuth.js");
        const token = signAccessToken({ sub: "u1", phoneNumber: "9500088697", role: "superadmin" });
        const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
        requireAuth(req, res, next);
        expect(next).toHaveBeenCalledWith(); // called with no error
        expect(req.user).toEqual({ id: "u1", phoneNumber: "9500088697", role: "superadmin" });
    });

    it("rejects a token signed with the wrong secret", async () => {
        const jwt = (await import("jsonwebtoken")).default;
        const { requireAuth } = await import("./requireAuth.js");
        const forged = jwt.sign({ sub: "u1", phoneNumber: "1", role: "superadmin" }, "wrong");
        const { req, res, next } = mockReqRes({ authorization: `Bearer ${forged}` });
        requireAuth(req, res, next);
        const err = next.mock.calls[0]![0];
        expect(err.statusCode).toBe(401);
    });
});

describe("requireRole", () => {
    it("rejects when req.user is missing (requireAuth not run first)", async () => {
        const { requireRole } = await import("./requireRole.js");
        const { req, res, next } = mockReqRes();
        requireRole("superadmin" as never)(req, res, next);
        expect(next.mock.calls[0]![0].statusCode).toBe(401);
    });

    it("rejects a 'user' role from an admin-only route", async () => {
        const { requireRole } = await import("./requireRole.js");
        const { req, res, next } = mockReqRes();
        req.user = { id: "u1", phoneNumber: "1", role: "manager" as never };
        requireRole("superadmin" as never)(req, res, next);
        expect(next.mock.calls[0]![0].statusCode).toBe(403);
    });

    it("allows an 'admin' role through an admin-only route", async () => {
        const { requireRole } = await import("./requireRole.js");
        const { req, res, next } = mockReqRes();
        req.user = { id: "u1", phoneNumber: "1", role: "superadmin" as never };
        requireRole("superadmin" as never)(req, res, next);
        expect(next).toHaveBeenCalledWith();
    });
});

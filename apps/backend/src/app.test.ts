// src/app.test.ts
import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";

beforeAll(() => {
    process.env.MONGO_URI = "mongodb://localhost:27017/test";
    process.env.JWT_ACCESS_SECRET = "test-access-secret-1234567890";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890";
    process.env.CORS_ORIGIN = "http://localhost:5173";
});

describe("app (DB-independent routes only)", () => {
    it("GET /health returns ok", async () => {
        const { createApp } = await import("./app.js");
        const app = createApp();
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });

    it("POST /api/v1/auth/login with missing fields returns 400 with the PRD's field message", async () => {
        const { createApp } = await import("./app.js");
        const app = createApp();
        const res = await request(app).post("/api/v1/auth/login").send({});
        expect(res.status).toBe(400);
        expect(res.body.fieldErrors.phoneNumber).toMatch(/Please enter a phoneNumber and passcode/);
    });

    it("GET /api/v1/categories with no auth header returns 401", async () => {
        const { createApp } = await import("./app.js");
        const app = createApp();
        const res = await request(app).get("/api/v1/categories");
        expect(res.status).toBe(401);
    });

    it("POST /api/v1/transactions with a Production type but no producedBy returns the PRD's exact message", async () => {
        const { createApp } = await import("./app.js");
        const { signAccessToken } = await import("./utils/jwt.js");
        const app = createApp();
        const token = signAccessToken({ sub: "u1", phoneNumber: "9500088697", role: "manager" });
        const res = await request(app)
            .post("/api/v1/transactions")
            .set("Authorization", `Bearer ${token}`)
            .send({
                inventoryId: "507f1f77bcf86cd799439011",
                transactionType: "Production",
                quantity: 5,
            });
        expect(res.status).toBe(400);
        expect(res.body.fieldErrors.producedBy).toBe("Select a Production Unit!");
    });
});

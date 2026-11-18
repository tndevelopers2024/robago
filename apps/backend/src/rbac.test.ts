// src/rbac.test.ts — who may do what. The whole access model, checked end to end through the real routes.
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { can, Permission, roleLabel, ROLE_PERMISSIONS, UserRole } from "@robago/shared";

beforeAll(() => {
    process.env.MONGO_URI = "mongodb://localhost:27017/test";
    process.env.JWT_ACCESS_SECRET = "test-access-secret-1234567890";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890";
    process.env.CORS_ORIGIN = "http://localhost:5173";
});

async function setup() {
    const { createApp } = await import("./app.js");
    const { signAccessToken } = await import("./utils/jwt.js");
    return {
        app: createApp(),
        superAdmin: signAccessToken({ sub: "s1", phoneNumber: "1234567890", role: "superadmin" }),
        manager: signAccessToken({ sub: "m1", phoneNumber: "9000000001", role: "manager" }),
        // an old token issued before the rename — must NOT quietly keep working with power
        legacyAdmin: signAccessToken({ sub: "x1", phoneNumber: "1111111111", role: "admin" as never }),
    };
}
const ID = "507f1f77bcf86cd799439011";

describe("the permission table", () => {
    it("super admin holds every permission", () => {
        for (const p of Object.values(Permission)) expect(can(UserRole.SuperAdmin, p)).toBe(true);
    });

    it("a manager gets inventory work — and not one money, people or user permission", () => {
        for (const p of [Permission.InventoryView, Permission.InventoryManage, Permission.TransactionsRecord, Permission.CatalogManage]) {
            expect(can(UserRole.Manager, p)).toBe(true);
        }
        for (const p of [Permission.StaffManage, Permission.ExpensesManage, Permission.AccountsManage, Permission.UsersManage, Permission.CatalogDelete, Permission.TransactionsEdit]) {
            expect(can(UserRole.Manager, p)).toBe(false);
        }
    });

    it("unknown, missing or legacy roles can do nothing", () => {
        for (const r of [undefined, null, "", "admin", "user", "owner"]) {
            for (const p of Object.values(Permission)) expect(can(r, p)).toBe(false);
        }
    });

    it("every role is defined and labelled", () => {
        expect(Object.keys(ROLE_PERMISSIONS).sort()).toEqual(["manager", "superadmin"]);
        expect(roleLabel("superadmin")).toBe("Super admin");
        expect(roleLabel("manager")).toBe("Manager");
        expect(roleLabel("admin")).toBe("No access");
    });
});

describe("routes a MANAGER must be locked out of (403)", () => {
    const blocked: [string, string][] = [
        ["get", "/api/v1/staff"],
        ["post", "/api/v1/staff"],
        ["get", "/api/v1/staff/ledger?month=2026-11"],
        ["put", "/api/v1/staff/payments"],
        ["get", "/api/v1/expenses/items"],
        ["post", "/api/v1/expenses"],
        ["post", "/api/v1/expenses/bulk"],
        ["get", "/api/v1/accounts"],
        ["get", "/api/v1/accounts/summary"],
        ["get", "/api/v1/accounts/activity"],
        ["post", `/api/v1/accounts/${ID}/entries`],
        ["post", `/api/v1/accounts/${ID}/reminders`],
        ["post", `/api/v1/accounts/entries/${ID}/void`],
        ["get", "/api/v1/users"],
        ["post", "/api/v1/users"],
        ["patch", "/api/v1/users/9876543210"],
        ["delete", "/api/v1/users/9876543210"],
        ["delete", `/api/v1/categories/${ID}`],
        ["delete", `/api/v1/products/${ID}`],
        ["delete", `/api/v1/warehouses/${ID}`],
        ["delete", `/api/v1/suppliers/${ID}`],
        ["delete", `/api/v1/production-units/${ID}`],
        ["patch", `/api/v1/transactions/${ID}`],
    ];
    for (const [method, path] of blocked) {
        it(`${method.toUpperCase()} ${path}`, async () => {
            const { app, manager } = await setup();
            const res = await (request(app) as never as Record<string, (p: string) => request.Test>)[method]!(path).set("Authorization", `Bearer ${manager}`).send({});
            expect(res.status).toBe(403);
        });
    }
});

describe("routes a MANAGER is allowed through (they stop at validation, not at the guard)", () => {
    // Bodies are deliberately invalid so the request is rejected by validation (400) before it could touch a database.
    const allowed: [string, string, object][] = [
        ["post", "/api/v1/inventory", {}],
        ["patch", `/api/v1/inventory/${ID}`, { price: "abc" }],
        ["post", "/api/v1/transactions", {}],
        ["post", "/api/v1/categories", {}],
        ["patch", `/api/v1/categories/${ID}`, { title: 5 }],
        ["post", "/api/v1/products", {}],
        ["patch", `/api/v1/products/${ID}`, { name: 5 }],
        ["post", "/api/v1/warehouses", {}],
        ["post", "/api/v1/suppliers", {}],
        ["post", "/api/v1/production-units", {}],
    ];
    for (const [method, path, body] of allowed) {
        it(`${method.toUpperCase()} ${path} → 400, not 403`, async () => {
            const { app, manager } = await setup();
            const res = await (request(app) as never as Record<string, (p: string) => request.Test>)[method]!(path).set("Authorization", `Bearer ${manager}`).send(body);
            expect(res.status).toBe(400);
        });
    }
});

describe("a SUPER ADMIN reaches everything a manager is blocked from", () => {
    const open: [string, string][] = [
        ["post", "/api/v1/staff"],
        ["put", "/api/v1/staff/payments"],
        ["post", "/api/v1/expenses"],
        ["post", "/api/v1/accounts"],
        ["post", `/api/v1/accounts/entries/${ID}/void`],
        ["post", "/api/v1/users"],
        ["patch", `/api/v1/transactions/${ID}`],
    ];
    for (const [method, path] of open) {
        it(`${method.toUpperCase()} ${path} → past the guard (400 validation)`, async () => {
            const { app, superAdmin } = await setup();
            const res = await (request(app) as never as Record<string, (p: string) => request.Test>)[method]!(path).set("Authorization", `Bearer ${superAdmin}`).send({});
            expect(res.status).toBe(400);
        });
    }
});

describe("old / invalid tokens", () => {
    it("a pre-rename 'admin' token gets no privileges (403), not a free pass", async () => {
        const { app, legacyAdmin } = await setup();
        expect((await request(app).get("/api/v1/accounts").set("Authorization", `Bearer ${legacyAdmin}`)).status).toBe(403);
        expect((await request(app).get("/api/v1/users").set("Authorization", `Bearer ${legacyAdmin}`)).status).toBe(403);
    });
    it("no token → 401 on every area", async () => {
        const { app } = await setup();
        for (const p of ["/api/v1/staff", "/api/v1/expenses/items", "/api/v1/accounts", "/api/v1/users", "/api/v1/inventory"]) {
            expect((await request(app).get(p)).status).toBe(401);
        }
    });
});

// src/expenseQuick.test.ts — the "type it like a message" parser, pinned with real examples.
import { describe, expect, it } from "vitest";
import request from "supertest";
import { EXPENSE_DEFAULT_ITEMS, matchItem, parseQuickEntries, type QuickItem } from "@robago/shared";

const items: QuickItem[] = EXPENSE_DEFAULT_ITEMS.flatMap(({ type, names }) =>
    names.map((name) => ({ id: `${type}-${name}`, name, type, active: true })),
);
const TODAY = new Date(2026, 10, 17); // 17 Nov 2026
const parse = (t: string) => parseQuickEntries(t, items, "2026-11-17", TODAY);
const found = (l: ReturnType<typeof parse>[number]) => (l.match.kind === "found" ? l.match.item.name : l.match.kind);

describe("quick expense parser", () => {
    it("reads item + amount in either order", () => {
        expect(found(parse("tea 120")[0]!)).toBe("Tea");
        expect(parse("tea 120")[0]!.amount).toBe(120);
        const rev = parse("₹1,800 tempo")[0]!;
        expect(found(rev)).toBe("Tempo");
        expect(rev.amount).toBe(1800);
    });

    it("splits several expenses on commas / new lines", () => {
        const lines = parse("tea 120, porter 400\nvegetables 350; courier 250");
        expect(lines.map((l) => [found(l), l.amount])).toEqual([["Tea", 120], ["Porter", 400], ["Vegetables", 350], ["Courier", 250]]);
    });

    it("understands k shorthand and decimals", () => {
        expect(parse("godown rent 32k")[0]!.amount).toBe(32000);
        expect(parse("tempo 1.8k")[0]!.amount).toBe(1800);
        expect(parse("chicken 899.50")[0]!.amount).toBe(899.5);
    });

    it("matches partial words and typos", () => {
        expect(found(parse("veg 200")[0]!)).toBe("Vegetables");
        expect(found(parse("vegetable 200")[0]!)).toBe("Vegetables");
        expect(found(parse("tempoo 1800")[0]!)).toBe("Tempo");
        expect(found(parse("tea stall 90")[0]!)).toBe("Tea");
    });

    it("asks when two items fit, rather than guessing", () => {
        const l = parse("rent 25000")[0]!;
        expect(l.match.kind).toBe("ambiguous");
        if (l.match.kind === "ambiguous") expect(l.match.options.map((o) => o.name).sort()).toEqual(["Godown rent", "Office rent"]);
    });

    it("offers a new item when nothing fits", () => {
        const l = parse("biscuits 80")[0]!;
        expect(l.match).toEqual({ kind: "new", name: "biscuits" });
        expect(l.amount).toBe(80);
    });

    it("flags a missing amount instead of inventing one", () => {
        expect(parse("tea")[0]!.amount).toBeNull();
        expect(parse("tea 0")[0]!.amount).toBeNull();
    });

    it("reads dates and notes", () => {
        expect(parse("tea 120 yesterday")[0]!.date).toBe("2026-11-16");
        expect(parse("tea 120 y")[0]!.date).toBe("2026-11-17"); // a bare "y" is NOT a date word
        expect(parse("porter 400 12/11")[0]!.date).toBe("2026-11-12");
        expect(parse("porter 400 3-10-2026")[0]!.date).toBe("2026-10-03");
        expect(parse("porter 400 31/2")[0]!.date).toBe("2026-11-17"); // impossible date ignored
        const n = parse("tea 120 (guests came)")[0]!;
        expect(n.note).toBe("guests came");
        expect(found(n)).toBe("Tea");
    });

    it("never matches an archived item", () => {
        const archived = items.map((i) => (i.name === "Tea" ? { ...i, active: false } : i));
        expect(matchItem("tea", archived).kind).toBe("new");
    });
});

describe("bulk expense endpoint guards", () => {
    async function ctx() {
        process.env.MONGO_URI = "mongodb://localhost:27017/test";
        process.env.JWT_ACCESS_SECRET = "test-access-secret-1234567890";
        process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890";
        process.env.CORS_ORIGIN = "http://localhost:5173";
        const { createApp } = await import("./app.js");
        const { signAccessToken } = await import("./utils/jwt.js");
        return { app: createApp(), admin: signAccessToken({ sub: "a1", phoneNumber: "1234567890", role: "superadmin" }) };
    }
    it("rejects an empty list and a bad entry before touching the database", async () => {
        const { app, admin } = await ctx();
        const empty = await request(app).post("/api/v1/expenses/bulk").set("Authorization", `Bearer ${admin}`).send({ entries: [] });
        expect(empty.status).toBe(400);
        const bad = await request(app)
            .post("/api/v1/expenses/bulk")
            .set("Authorization", `Bearer ${admin}`)
            .send({ entries: [{ date: "2026-11-10", itemId: "507f1f77bcf86cd799439011", amount: 0 }] });
        expect(bad.status).toBe(400);
        expect(bad.body.fieldErrors["entries.0.amount"]).toMatch(/more than 0/);
    });
});

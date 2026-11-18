// src/crm.test.ts — DB-independent checks for the school-visits module: who may use it, and what it accepts.
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import {
    can,
    createSchoolSchema,
    haversineKm,
    locate,
    nearbyDistricts,
    normPlace,
    roadKm,
    TN_DISTRICTS,
    logVisitSchema,
    Permission,
    SCHOOL_PROSPECTS_SAMPLE,
    SCHOOL_VISITS_SAMPLE,
    UserRole,
    updateSchoolSchema,
} from "@robago/shared";

beforeAll(() => {
    process.env.MONGO_URI = "mongodb://localhost:27017/test";
    process.env.JWT_ACCESS_SECRET = "test-access-secret-1234567890";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234567890";
    process.env.CORS_ORIGIN = "http://localhost:5173";
});

async function ctx() {
    const { createApp } = await import("./app.js");
    const { signAccessToken } = await import("./utils/jwt.js");
    return {
        app: createApp(),
        admin: signAccessToken({ sub: "a1", phoneNumber: "1234567890", role: "superadmin" }),
        manager: signAccessToken({ sub: "m1", phoneNumber: "9000000001", role: "manager" }),
    };
}
const ID = "507f1f77bcf86cd799439011";
const school = { name: "Test School", district: "Salem", place: "Attur", board: "cbse", studentCount: 500, studentNote: "", correspondent: "", phone: "", reference: "", notes: "" };

describe("CRM permission", () => {
    it("is for super admins; a manager (inventory only) does not have it", () => {
        expect(can(UserRole.SuperAdmin, Permission.CrmManage)).toBe(true);
        expect(can(UserRole.Manager, Permission.CrmManage)).toBe(false);
    });
});

describe("CRM API guards", () => {
    const routes: [string, string][] = [
        ["get", "/api/v1/crm/schools"],
        ["post", "/api/v1/crm/schools"],
        ["get", `/api/v1/crm/schools/${ID}`],
        ["patch", `/api/v1/crm/schools/${ID}`],
        ["post", `/api/v1/crm/schools/${ID}/visits`],
    ];
    for (const [method, path] of routes) {
        it(`${method.toUpperCase()} ${path}: 401 without a token, 403 for a manager`, async () => {
            const { app, manager } = await ctx();
            const call = (request(app) as never as Record<string, (p: string) => request.Test>)[method]!;
            expect((await call(path)).status).toBe(401);
            expect((await call(path).set("Authorization", `Bearer ${manager}`).send({})).status).toBe(403);
        });
    }
    it("a super admin gets past the guard and is stopped by validation (400), not by permissions", async () => {
        const { app, admin } = await ctx();
        expect((await request(app).post("/api/v1/crm/schools").set("Authorization", `Bearer ${admin}`).send({})).status).toBe(400);
        expect((await request(app).post(`/api/v1/crm/schools/${ID}/visits`).set("Authorization", `Bearer ${admin}`).send({})).status).toBe(400);
    });
});

describe("CRM validation", () => {
    it("a school needs a name and a district", () => {
        expect(createSchoolSchema.safeParse(school).success).toBe(true);
        expect(createSchoolSchema.safeParse({ ...school, name: " " }).success).toBe(false);
        expect(createSchoolSchema.safeParse({ ...school, district: "" }).success).toBe(false);
        expect(createSchoolSchema.safeParse({ ...school, board: "igcse" }).success).toBe(false);
    });
    it("a school can be saved together with its first visit", () => {
        const visit = { date: "2026-11-04", metWith: "Principal", outcome: "Showed sample", stage: "sampled", nextFollowUp: "" };
        expect(createSchoolSchema.safeParse({ ...school, visit }).success).toBe(true);
    });
    it("a visit must say what happened and cannot leave a school as a prospect", () => {
        const ok = { date: "2026-11-04", metWith: "", outcome: "Met the MD", stage: "visited", nextFollowUp: "" };
        expect(logVisitSchema.safeParse(ok).success).toBe(true);
        expect(logVisitSchema.safeParse({ ...ok, outcome: "  " }).success).toBe(false);
        expect(logVisitSchema.safeParse({ ...ok, stage: "prospect" }).success).toBe(false);
        expect(logVisitSchema.safeParse({ ...ok, date: "4/11/26" }).success).toBe(false);
        expect(logVisitSchema.safeParse({ ...ok, nextFollowUp: "2026-12-01" }).success).toBe(true);
    });
    it("an edit may change one field without the rest", () => {
        expect(updateSchoolSchema.safeParse({}).success).toBe(true);
        expect(updateSchoolSchema.safeParse({ phone: "9876543210" }).success).toBe(true);
    });
});

describe("the starter data", () => {
    it("every visited-school row passes the same checks as a real save", () => {
        for (const r of SCHOOL_VISITS_SAMPLE) {
            const res = createSchoolSchema.safeParse({
                name: r.name, district: r.district, place: r.place, board: r.board, studentCount: r.studentCount,
                studentNote: r.studentNote, correspondent: r.correspondent, phone: r.phone, reference: r.reference, notes: r.notes,
                visit: { date: r.date, metWith: r.metWith, outcome: r.outcome, stage: r.stage, nextFollowUp: "" },
            });
            expect(res.success, r.name).toBe(true);
        }
    });
    it("no school appears twice, and each district has prospects to suggest", () => {
        const key = (n: string, d: string, p: string) => `${n}|${d}|${p}`.toLowerCase();
        const keys = [...SCHOOL_VISITS_SAMPLE, ...SCHOOL_PROSPECTS_SAMPLE].map((r) => key(r.name, r.district, r.place));
        expect(new Set(keys).size).toBe(keys.length);
        const districts = new Set(SCHOOL_VISITS_SAMPLE.map((r) => r.district));
        for (const d of districts) expect(SCHOOL_PROSPECTS_SAMPLE.some((p) => p.district === d), d).toBe(true);
    });
});

describe("school address", () => {
    it("is optional and capped", () => {
        expect(createSchoolSchema.safeParse(school).success).toBe(true);
        expect(createSchoolSchema.safeParse({ ...school, address: "12, Main Road, Salem 636001" }).success).toBe(true);
        expect(createSchoolSchema.safeParse({ ...school, address: "x".repeat(301) }).success).toBe(false);
        expect(updateSchoolSchema.safeParse({ address: "New address" }).success).toBe(true);
    });
});

describe("map positions and distances", () => {
    it("knows where a school is: pin first, then its town, then its district", () => {
        expect(locate({ place: "Harur", district: "Dharmapuri", lat: 11, lng: 78 })?.level).toBe("pin");
        expect(locate({ place: "Harur", district: "Dharmapuri" })?.level).toBe("town");
        expect(locate({ place: "", district: "Salem" })?.level).toBe("district");
        expect(locate({ place: "Somewhere", district: "Atlantis" })).toBeNull();
    });
    it("reads messy place names from the sheet", () => {
        expect(normPlace("Villupuram (31 km)")).toBe("villupuram");
        expect(locate({ place: "Trichy", district: "Tiruchirappalli" })?.level).toBe("town");
        expect(locate({ place: "Perambalur (20 km towards Chennai)", district: "Perambalur" })?.level).toBe("town");
    });
    it("distances are sensible (Salem–Namakkal ≈ 50 km straight, a bit more by road)", () => {
        const salem = locate({ place: "Salem", district: "Salem" })!;
        const nam = locate({ place: "Namakkal", district: "Namakkal" })!;
        const straight = haversineKm(salem, nam);
        expect(straight).toBeGreaterThan(40);
        expect(straight).toBeLessThan(60);
        expect(roadKm(salem, nam)).toBeGreaterThan(straight);
        expect(roadKm(salem, salem)).toBe(0);
    });
    it("suggests the next districts on the way, nearest first", () => {
        const near = nearbyDistricts("Salem", 5).map((d) => d.name);
        expect(near.slice(0, 3)).toContain("Namakkal");
        expect(near).toContain("Dharmapuri");
        expect(nearbyDistricts("Salem", 8, 200).map((d) => d.name)).toContain("Krishnagiri");
        const kms = nearbyDistricts("Salem", 8, 300).map((d) => d.km);
        expect(kms).toEqual([...kms].sort((a, b) => a - b));
        expect(nearbyDistricts("Nowhere")).toEqual([]);
    });
    it("every district in the starter data has a map position", () => {
        for (const r of [...SCHOOL_VISITS_SAMPLE, ...SCHOOL_PROSPECTS_SAMPLE]) expect(TN_DISTRICTS[r.district], r.district).toBeTruthy();
    });
    it("a pin must be inside the region", () => {
        expect(createSchoolSchema.safeParse({ ...school, lat: 11.66, lng: 78.15 }).success).toBe(true);
        expect(createSchoolSchema.safeParse({ ...school, lat: 51, lng: 0 }).success).toBe(false);
    });
});

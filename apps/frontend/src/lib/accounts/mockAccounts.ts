// src/lib/accounts/mockAccounts.ts
// Offline demo mode only: the same /accounts routes as the real backend, kept in this browser.
import {
    AccountKind,
    AuditAction,
    CREDITORS_SAMPLE,
    DEBTORS_SAMPLE,
    EntryType,
    whatsappLink,
    type AccountDTO,
    type AccountsSummaryDTO,
    type ActorDTO,
    type AuditDTO,
    type EntryDTO,
} from "@robago/shared";

const KEY = "robago_accounts_demo_v1";
const ME: ActorDTO = { id: "demo-admin", name: "Demo Admin", phone: "1234567890" };
const SYSTEM: ActorDTO = { id: "system", name: "Import from sheet", phone: "" };

interface Db {
    accounts: Omit<AccountDTO, "billed" | "paid" | "balance" | "entryCount" | "lastPayment" | "lastReminder">[];
    entries: EntryDTO[];
    audit: AuditDTO[];
}

const now = () => new Date().toISOString();
const todayIso = () => new Date().toLocaleDateString("en-CA");
const rs = (n: number) => `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
const uid = () => crypto.randomUUID().slice(0, 10);

function seed(): Db {
    const db: Db = { accounts: [], entries: [], audit: [] };
    const add = (kind: AccountKind, rows: { name: string; balance: number; dueDate?: string }[]) => {
        for (const r of rows) {
            const id = `acc-${uid()}`;
            const t = now();
            db.accounts.push({
                id,
                name: r.name,
                kind,
                group: "",
                phone: "",
                email: "",
                notes: "",
                dueDate: r.dueDate ?? "",
                active: true,
                createdBy: SYSTEM,
                updatedBy: SYSTEM,
                createdAt: t,
                updatedAt: t,
            });
            db.entries.push({
                id: `ent-${uid()}`,
                accountId: id,
                type: EntryType.Charge,
                amount: r.balance,
                date: todayIso(),
                method: "",
                reference: "",
                note: "Opening balance from the old sheet",
                createdBy: SYSTEM,
                createdAt: t,
                void: null,
            });
            db.audit.push({
                id: `log-${uid()}`,
                at: t,
                actor: SYSTEM,
                action: AuditAction.AccountCreate,
                accountId: id,
                accountName: r.name,
                summary: `imported ${kind} "${r.name}" with ${rs(r.balance)} outstanding`,
                data: {},
            });
        }
    };
    add(AccountKind.Creditor, CREDITORS_SAMPLE);
    add(AccountKind.Debtor, DEBTORS_SAMPLE);
    return db;
}

function load(): Db {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw) as Db;
    } catch {
        // fall through
    }
    const db = seed();
    save(db);
    return db;
}
function save(db: Db) {
    try {
        localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
        // storage blocked — demo data won't persist
    }
}

function withTotals(db: Db, a: Db["accounts"][number]): AccountDTO {
    const live = db.entries.filter((e) => e.accountId === a.id && !e.void);
    const billed = round2(live.filter((e) => e.type === EntryType.Charge).reduce((s, e) => s + e.amount, 0));
    const pays = live
        .filter((e) => e.type === EntryType.Payment)
        .sort((x, y) => (x.date === y.date ? (x.createdAt < y.createdAt ? 1 : -1) : x.date < y.date ? 1 : -1));
    const paid = round2(pays.reduce((s, e) => s + e.amount, 0));
    const rem = db.audit
        .filter((l) => l.accountId === a.id && l.action.startsWith("reminder."))
        .sort((x, y) => (x.at < y.at ? 1 : -1))[0];
    return {
        ...a,
        billed,
        paid,
        balance: round2(billed - paid),
        entryCount: live.length,
        lastPayment: pays[0]
            ? { date: pays[0].date, amount: pays[0].amount, at: pays[0].createdAt, by: pays[0].createdBy }
            : null,
        lastReminder: rem
            ? { at: rem.at, channel: rem.action === AuditAction.ReminderEmail ? "email" : "whatsapp", by: rem.actor }
            : null,
    };
}

function logIt(
    db: Db,
    action: AuditAction,
    acc: { id: string; name: string } | null,
    summary: string,
    data: Record<string, unknown> = {},
) {
    db.audit.unshift({
        id: `log-${uid()}`,
        at: now(),
        actor: ME,
        action,
        accountId: acc?.id ?? null,
        accountName: acc?.name ?? "",
        summary,
        data,
    });
}

export type MockResult = { status: number; data?: unknown; error?: string; fieldErrors?: Record<string, string> };

export function handleAccountsMock(
    method: string,
    path: string,
    params: Record<string, string | undefined>,
    body: Record<string, unknown>,
): MockResult | null {
    if (path !== "/accounts" && !path.startsWith("/accounts/")) return null;
    const db = load();
    const rest = path.slice("/accounts".length).replace(/^\//, "");

    if (rest === "" && method === "GET") {
        const rows = db.accounts.filter(
            (a) => (!params.kind || a.kind === params.kind) && (params.archived === "true" || a.active),
        );
        return { status: 200, data: rows.map((a) => withTotals(db, a)) };
    }

    if (rest === "summary") {
        const today = todayIso();
        const all = db.accounts.filter((a) => a.active).map((a) => withTotals(db, a));
        const side = (k: AccountKind) => {
            const r = all.filter((a) => a.kind === k && a.balance > 0);
            return {
                total: round2(r.reduce((s, a) => s + a.balance, 0)),
                count: r.length,
                overdue: round2(r.filter((a) => a.dueDate && a.dueDate < today).reduce((s, a) => s + a.balance, 0)),
            };
        };
        const month = today.slice(0, 7);
        const flow = (k: AccountKind) =>
            round2(
                db.entries
                    .filter(
                        (e) =>
                            e.type === EntryType.Payment &&
                            !e.void &&
                            e.date.startsWith(month) &&
                            db.accounts.find((a) => a.id === e.accountId)?.kind === k,
                    )
                    .reduce((s, e) => s + e.amount, 0),
            );
        const payable = side(AccountKind.Creditor);
        const receivable = side(AccountKind.Debtor);
        const out: AccountsSummaryDTO = {
            payable,
            receivable,
            net: round2(receivable.total - payable.total),
            thisMonth: { paidOut: flow(AccountKind.Creditor), collected: flow(AccountKind.Debtor) },
            emailConfigured: false,
        };
        return { status: 200, data: out };
    }

    if (rest === "activity") {
        const limit = Number(params.limit ?? 50);
        let items = db.audit.filter(
            (l) =>
                (!params.user || l.actor.id === params.user) &&
                (!params.action || l.action === params.action) &&
                (!params.accountId || l.accountId === params.accountId),
        );
        if (params.from) items = items.filter((l) => l.at.slice(0, 10) >= (params.from as string));
        if (params.to) items = items.filter((l) => l.at.slice(0, 10) <= (params.to as string));
        const actors = [...new Map(db.audit.map((l) => [l.actor.id, l.actor])).values()];
        return {
            status: 200,
            data: {
                items: items.slice(0, limit),
                nextBefore: items.length > limit ? items[limit - 1]!.at : null,
                actors,
            },
        };
    }

    if (rest === "" && method === "POST") {
        const name = String(body.name ?? "").trim();
        const kind = body.kind as AccountKind;
        if (!name) return { status: 400, error: "Validation failed", fieldErrors: { name: "Name is required" } };
        if (db.accounts.some((a) => a.kind === kind && a.name.toLowerCase() === name.toLowerCase()))
            return {
                status: 409,
                error: `"${name}" already exists`,
                fieldErrors: { name: "This name is already in the list" },
            };
        const t = now();
        const acc = {
            id: `acc-${uid()}`,
            name,
            kind,
            group: String(body.group ?? ""),
            phone: String(body.phone ?? ""),
            email: String(body.email ?? ""),
            notes: String(body.notes ?? ""),
            dueDate: String(body.dueDate ?? ""),
            active: true,
            createdBy: ME,
            updatedBy: ME,
            createdAt: t,
            updatedAt: t,
        };
        db.accounts.push(acc);
        const opening = Number(body.openingBalance ?? 0);
        if (opening > 0)
            db.entries.push({
                id: `ent-${uid()}`,
                accountId: acc.id,
                type: EntryType.Charge,
                amount: opening,
                date: todayIso(),
                method: "",
                reference: "",
                note: "Opening balance",
                createdBy: ME,
                createdAt: t,
                void: null,
            });
        logIt(
            db,
            AuditAction.AccountCreate,
            acc,
            `added ${kind} "${name}"${opening > 0 ? ` with ${rs(opening)} outstanding` : ""}`,
        );
        save(db);
        return { status: 201, data: withTotals(db, acc) };
    }

    const voidMatch = rest.match(/^entries\/([^/]+)\/void$/);
    if (voidMatch && method === "POST") {
        const e = db.entries.find((x) => x.id === voidMatch[1]);
        if (!e) return { status: 404, error: "Entry not found" };
        if (e.void) return { status: 409, error: `Already voided by ${e.void.by.name}.` };
        const reason = String(body.reason ?? "").trim();
        if (reason.length < 3)
            return {
                status: 400,
                error: "Validation failed",
                fieldErrors: { reason: "Say why (at least a few words)" },
            };
        e.void = { at: now(), by: ME, reason };
        const acc = db.accounts.find((a) => a.id === e.accountId)!;
        logIt(
            db,
            AuditAction.EntryVoid,
            acc,
            `voided ${e.type === EntryType.Payment ? "the payment" : "the entry"} of ${rs(e.amount)} (${e.date}) on ${acc.name} — "${reason}"`,
            { reason },
        );
        save(db);
        return { status: 200, data: e };
    }

    const m = rest.match(/^([^/]+)(?:\/(entries|reminders))?$/);
    if (!m) return { status: 404, error: "Not found" };
    const acc = db.accounts.find((a) => a.id === m[1]);
    if (!acc) return { status: 404, error: "Account not found" };

    if (!m[2] && method === "GET") {
        return {
            status: 200,
            data: {
                account: withTotals(db, acc),
                entries: db.entries
                    .filter((e) => e.accountId === acc.id)
                    .sort((a, b) =>
                        a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1,
                    ),
                activity: db.audit.filter((l) => l.accountId === acc.id).slice(0, 100),
            },
        };
    }

    if (!m[2] && method === "PATCH") {
        if (body.expectedUpdatedAt && body.expectedUpdatedAt !== acc.updatedAt)
            return {
                status: 409,
                error: `${acc.updatedBy.name} changed this account while you were editing. Reload to see their changes, then try again.`,
            };
        const changed: string[] = [];
        for (const f of ["name", "group", "phone", "email", "notes", "dueDate"] as const) {
            if (body[f] !== undefined && body[f] !== acc[f]) {
                (acc as Record<string, unknown>)[f] = String(body[f]);
                changed.push(f);
            }
        }
        if (body.active !== undefined && body.active !== acc.active) {
            acc.active = Boolean(body.active);
            logIt(
                db,
                acc.active ? AuditAction.AccountRestore : AuditAction.AccountArchive,
                acc,
                `${acc.active ? "restored" : "archived"} "${acc.name}"`,
            );
        }
        if (changed.length) logIt(db, AuditAction.AccountUpdate, acc, `updated ${changed.join(", ")} of "${acc.name}"`);
        acc.updatedBy = ME;
        acc.updatedAt = now();
        save(db);
        return { status: 200, data: withTotals(db, acc) };
    }

    if (m[2] === "entries" && method === "POST") {
        const amount = Number(body.amount);
        if (!(amount > 0))
            return { status: 400, error: "Validation failed", fieldErrors: { amount: "Amount must be more than 0" } };
        if (!acc.active) return { status: 409, error: "This account is archived. Restore it before adding entries." };
        const type = body.type as EntryType;
        const entry: EntryDTO = {
            id: `ent-${uid()}`,
            accountId: acc.id,
            type,
            amount,
            date: String(body.date),
            method: (body.method as EntryDTO["method"]) ?? "",
            reference: String(body.reference ?? ""),
            note: String(body.note ?? ""),
            createdBy: ME,
            createdAt: now(),
            void: null,
        };
        db.entries.push(entry);
        const cred = acc.kind === AccountKind.Creditor;
        const pay = type === EntryType.Payment;
        logIt(
            db,
            pay ? AuditAction.EntryPayment : AuditAction.EntryCharge,
            acc,
            pay
                ? cred
                    ? `recorded a payment of ${rs(amount)} to ${acc.name}`
                    : `recorded ${rs(amount)} received from ${acc.name}`
                : cred
                  ? `added a bill of ${rs(amount)} from ${acc.name}`
                  : `added ${rs(amount)} owed by ${acc.name}`,
            { amount, method: entry.method, note: entry.note, balanceAfter: withTotals(db, acc).balance },
        );
        save(db);
        return { status: 201, data: entry };
    }

    if (m[2] === "reminders" && method === "POST") {
        if (acc.kind !== AccountKind.Debtor)
            return { status: 400, error: "Reminders are only for debtors — people who owe you." };
        const bal = withTotals(db, acc).balance;
        if (body.channel === "email")
            return {
                status: 503,
                error: "Email isn't set up in demo mode. Connect the real server to send email — or send this one on WhatsApp.",
            };
        const url = whatsappLink(acc.phone, String(body.message ?? ""));
        if (!url)
            return {
                status: 400,
                error: "No valid phone number",
                fieldErrors: { phone: `Add a valid mobile number for ${acc.name} first` },
            };
        logIt(
            db,
            AuditAction.ReminderWhatsapp,
            acc,
            `opened a WhatsApp reminder for ${acc.name} (${rs(bal)} pending)`,
            {},
        );
        save(db);
        return { status: 200, data: { channel: "whatsapp", to: acc.phone, url } };
    }
    return { status: 404, error: "Not found" };
}

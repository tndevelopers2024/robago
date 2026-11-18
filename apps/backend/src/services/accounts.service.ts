// src/services/accounts.service.ts
// Creditors & debtors: accounts, an append-only payment ledger, an activity log, and reminders.
import mongoose, { isValidObjectId, type ClientSession, type HydratedDocument, type Types } from "mongoose";
import {
    AccountKind,
    AuditAction,
    EntryType,
    ReminderChannel,
    whatsappLink,
    type AccountDetailDTO,
    type AccountDTO,
    type AccountsSummaryDTO,
    type ActivityPageDTO,
    type ActivityQuery,
    type ActorDTO,
    type AuditDTO,
    type CreateAccountInput,
    type CreateEntryInput,
    type EntryDTO,
    type SendReminderInput,
    type UpdateAccountInput,
    type VoidEntryInput,
} from "@robago/shared";
import { Account, AccountEntry, AuditLog } from "../models/Accounts.model.js";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { isEmailConfigured, sendEmail } from "./email.service.js";

// ---- small helpers ----------------------------------------------------------------------------------------

const round2 = (n: number) => Math.round(n * 100) / 100;
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const rs = (n: number) => `₹${inr.format(n)}`;
const nameKey = (s: string) => s.trim().toLowerCase();
const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type AccountDoc = HydratedDocument<{
    name: string; nameKey: string; kind: string; group: string; phone: string; email: string; notes: string;
    dueDate: string; active: boolean; createdBy: ActorDTO; updatedBy: ActorDTO;
}> & { createdAt: Date; updatedAt: Date };

function assertId(id: string, what: string) {
    if (!isValidObjectId(id)) throw ApiError.notFound(`${what} not found`);
}

/** Who is making this request, by name — so the log reads "Ismail", not a phone number. */
export async function resolveActor(user: { id: string; phoneNumber: string } | undefined): Promise<ActorDTO> {
    if (!user) throw ApiError.unauthorized();
    const u = await User.findById(user.id).select("name").lean();
    return { id: user.id, name: u?.name ?? user.phoneNumber, phone: user.phoneNumber };
}

async function inTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    try {
        let result!: T;
        await session.withTransaction(async () => {
            result = await fn(session);
        });
        return result;
    } finally {
        await session.endSession();
    }
}

async function log(
    session: ClientSession | null,
    actor: ActorDTO,
    action: AuditAction,
    account: { _id: unknown; name: string } | null,
    summary: string,
    data: Record<string, unknown> = {},
) {
    await AuditLog.create(
        [{ actor, action, accountId: account?._id ?? null, accountName: account?.name ?? "", summary, data }],
        session ? { session } : undefined,
    );
}

// ---- totals ---------------------------------------------------------------------------------------------

interface Totals {
    billed: number;
    paid: number;
    count: number;
    lastPayment: AccountDTO["lastPayment"];
    lastReminder: AccountDTO["lastReminder"];
}

/** The balance of every account, worked out from the live (non-voided) ledger rows. */
async function totalsFor(ids: Types.ObjectId[], session?: ClientSession): Promise<Map<string, Totals>> {
    const opts = session ? { session } : {};
    const [sums, lastPays, lastRems] = await Promise.all([
        AccountEntry.aggregate<{ _id: { a: Types.ObjectId; t: string }; total: number; n: number }>([
            { $match: { accountId: { $in: ids }, void: null } },
            { $group: { _id: { a: "$accountId", t: "$type" }, total: { $sum: "$amount" }, n: { $sum: 1 } } },
        ]).option(opts),
        AccountEntry.aggregate<{ _id: Types.ObjectId; doc: { date: string; amount: number; createdAt: Date; createdBy: ActorDTO } }>([
            { $match: { accountId: { $in: ids }, type: EntryType.Payment, void: null } },
            { $sort: { date: -1, createdAt: -1 } },
            { $group: { _id: "$accountId", doc: { $first: "$$ROOT" } } },
        ]).option(opts),
        AuditLog.aggregate<{ _id: Types.ObjectId; doc: { at: Date; action: string; actor: ActorDTO } }>([
            { $match: { accountId: { $in: ids }, action: { $in: [AuditAction.ReminderEmail, AuditAction.ReminderWhatsapp] } } },
            { $sort: { at: -1 } },
            { $group: { _id: "$accountId", doc: { $first: "$$ROOT" } } },
        ]).option(opts),
    ]);

    const map = new Map<string, Totals>();
    const get = (id: string) => {
        let t = map.get(id);
        if (!t) map.set(id, (t = { billed: 0, paid: 0, count: 0, lastPayment: null, lastReminder: null }));
        return t;
    };
    for (const s of sums) {
        const t = get(String(s._id.a));
        if (s._id.t === EntryType.Charge) t.billed += s.total;
        else t.paid += s.total;
        t.count += s.n;
    }
    for (const p of lastPays) {
        get(String(p._id)).lastPayment = { date: p.doc.date, amount: p.doc.amount, at: p.doc.createdAt.toISOString(), by: p.doc.createdBy };
    }
    for (const r of lastRems) {
        get(String(r._id)).lastReminder = {
            at: r.doc.at.toISOString(),
            channel: r.doc.action === AuditAction.ReminderEmail ? ReminderChannel.Email : ReminderChannel.Whatsapp,
            by: r.doc.actor,
        };
    }
    return map;
}

function toAccountDTO(a: AccountDoc, t?: Totals): AccountDTO {
    const billed = round2(t?.billed ?? 0);
    const paid = round2(t?.paid ?? 0);
    return {
        id: a.id as string,
        name: a.name,
        kind: a.kind as AccountKind,
        group: a.group,
        phone: a.phone,
        email: a.email,
        notes: a.notes,
        dueDate: a.dueDate,
        active: a.active,
        createdBy: a.createdBy,
        updatedBy: a.updatedBy,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        billed,
        paid,
        balance: round2(billed - paid),
        entryCount: t?.count ?? 0,
        lastPayment: t?.lastPayment ?? null,
        lastReminder: t?.lastReminder ?? null,
    };
}

interface EntryLike {
    id?: string;
    _id?: unknown;
    accountId: unknown;
    type: string;
    amount: number;
    date: string;
    method?: string;
    reference?: string;
    note?: string;
    createdBy: ActorDTO;
    createdAt: Date;
    void?: { at: Date; by: ActorDTO; reason: string } | null;
}

const toEntryDTO = (e: EntryLike): EntryDTO => ({
    id: e.id ?? String(e._id),
    accountId: String(e.accountId),
    type: e.type as EntryDTO["type"],
    amount: e.amount,
    date: e.date,
    method: (e.method ?? "") as EntryDTO["method"],
    reference: e.reference ?? "",
    note: e.note ?? "",
    createdBy: e.createdBy,
    createdAt: e.createdAt.toISOString(),
    void: e.void ? { at: e.void.at.toISOString(), by: e.void.by, reason: e.void.reason } : null,
});

interface AuditLike {
    _id: unknown;
    at: Date;
    actor: ActorDTO;
    action: string;
    accountId?: unknown;
    accountName?: string;
    summary: string;
    data?: unknown;
}

const toAuditDTO = (a: AuditLike): AuditDTO => ({
    id: String(a._id),
    at: a.at.toISOString(),
    actor: a.actor,
    action: a.action as AuditDTO["action"],
    accountId: a.accountId ? String(a.accountId) : null,
    accountName: a.accountName ?? "",
    summary: a.summary,
    data: (a.data ?? {}) as Record<string, unknown>,
});

// ---- accounts -------------------------------------------------------------------------------------------

export async function listAccounts(kind?: AccountKind, includeArchived = false): Promise<AccountDTO[]> {
    const docs = await Account.find({ ...(kind ? { kind } : {}), ...(includeArchived ? {} : { active: true }) }).sort({ _id: 1 });
    const totals = await totalsFor(docs.map((d) => d._id));
    return docs.map((d) => toAccountDTO(d as unknown as AccountDoc, totals.get(String(d._id))));
}

export async function getAccountDetail(id: string): Promise<AccountDetailDTO> {
    assertId(id, "Account");
    const doc = await Account.findById(id);
    if (!doc) throw ApiError.notFound("Account not found");
    const [totals, entries, activity] = await Promise.all([
        totalsFor([doc._id]),
        AccountEntry.find({ accountId: doc._id }).sort({ date: -1, createdAt: -1 }),
        AuditLog.find({ accountId: doc._id }).sort({ at: -1 }).limit(100).lean(),
    ]);
    return {
        account: toAccountDTO(doc as unknown as AccountDoc, totals.get(String(doc._id))),
        entries: entries.map((e) => toEntryDTO(e as unknown as EntryLike)),
        activity: activity.map((a) => toAuditDTO(a as unknown as AuditLike)),
    };
}

export async function createAccount(input: CreateAccountInput, actor: ActorDTO): Promise<AccountDTO> {
    const key = nameKey(input.name);
    const clash = await Account.findOne({ kind: input.kind, nameKey: key });
    if (clash) throw ApiError.conflict(`"${clash.name}" already exists`, { name: "This name is already in the list" });

    const created = await inTransaction(async (session) => {
        const [doc] = await Account.create(
            [
                {
                    name: input.name,
                    nameKey: key,
                    kind: input.kind,
                    group: input.group ?? "",
                    phone: input.phone ?? "",
                    email: input.email ?? "",
                    notes: input.notes ?? "",
                    dueDate: input.dueDate ?? "",
                    createdBy: actor,
                    updatedBy: actor,
                },
            ],
            { session },
        );
        const opening = input.openingBalance ?? 0;
        if (opening > 0) {
            await AccountEntry.create(
                [{ accountId: doc!._id, type: EntryType.Charge, amount: opening, date: todayIso(), note: "Opening balance", createdBy: actor }],
                { session },
            );
        }
        await log(
            session,
            actor,
            AuditAction.AccountCreate,
            doc!,
            `added ${input.kind === AccountKind.Creditor ? "creditor" : "debtor"} "${input.name}"${opening > 0 ? ` with ${rs(opening)} outstanding` : ""}`,
            { kind: input.kind, openingBalance: opening },
        );
        return doc!;
    });
    const totals = await totalsFor([created._id]);
    return toAccountDTO(created as unknown as AccountDoc, totals.get(String(created._id)));
}

const EDITABLE = ["name", "group", "phone", "email", "notes", "dueDate"] as const;

export async function updateAccount(id: string, input: UpdateAccountInput, actor: ActorDTO): Promise<AccountDTO> {
    assertId(id, "Account");
    const doc = await Account.findById(id);
    if (!doc) throw ApiError.notFound("Account not found");

    // Two admins editing the same account: the second save is refused with who changed it, instead of silently winning.
    if (input.expectedUpdatedAt && doc.updatedAt.toISOString() !== input.expectedUpdatedAt) {
        throw ApiError.conflict(
            `${doc.updatedBy?.name ?? "Someone"} changed this account while you were editing. Reload to see their changes, then try again.`,
        );
    }

    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const f of EDITABLE) {
        const next = input[f];
        if (next !== undefined && next !== doc[f]) {
            if (f === "name") {
                const clash = await Account.findOne({ kind: doc.kind, nameKey: nameKey(next), _id: { $ne: doc._id } });
                if (clash) throw ApiError.conflict(`"${clash.name}" already exists`, { name: "This name is already in the list" });
                doc.nameKey = nameKey(next);
            }
            changed[f] = { from: doc[f], to: next };
            doc[f] = next;
        }
    }
    const archiveChange = input.active !== undefined && input.active !== doc.active ? input.active : null;
    if (archiveChange !== null) doc.active = archiveChange;
    if (!Object.keys(changed).length && archiveChange === null) {
        const t = await totalsFor([doc._id]);
        return toAccountDTO(doc as unknown as AccountDoc, t.get(String(doc._id)));
    }
    doc.updatedBy = actor;

    await inTransaction(async (session) => {
        await doc.save({ session });
        if (Object.keys(changed).length) {
            await log(session, actor, AuditAction.AccountUpdate, doc, `updated ${Object.keys(changed).join(", ")} of "${doc.name}"`, { changed });
        }
        if (archiveChange !== null) {
            await log(session, actor, archiveChange ? AuditAction.AccountRestore : AuditAction.AccountArchive, doc, `${archiveChange ? "restored" : "archived"} "${doc.name}"`);
        }
    });
    const totals = await totalsFor([doc._id]);
    return toAccountDTO(doc as unknown as AccountDoc, totals.get(String(doc._id)));
}

// ---- ledger entries -------------------------------------------------------------------------------------

export async function addEntry(accountId: string, input: CreateEntryInput, actor: ActorDTO): Promise<EntryDTO> {
    assertId(accountId, "Account");
    const account = await Account.findById(accountId);
    if (!account) throw ApiError.notFound("Account not found");
    if (!account.active) throw ApiError.conflict("This account is archived. Restore it before adding entries.");

    const isCreditor = account.kind === AccountKind.Creditor;
    return inTransaction(async (session) => {
        const [entry] = await AccountEntry.create(
            [
                {
                    accountId: account._id,
                    type: input.type,
                    amount: input.amount,
                    date: input.date,
                    method: input.method ?? "",
                    reference: input.reference ?? "",
                    note: input.note ?? "",
                    createdBy: actor,
                },
            ],
            { session },
        );
        const t = (await totalsFor([account._id], session)).get(String(account._id));
        const balanceAfter = round2((t?.billed ?? 0) - (t?.paid ?? 0));
        const isPayment = input.type === EntryType.Payment;
        await log(
            session,
            actor,
            isPayment ? AuditAction.EntryPayment : AuditAction.EntryCharge,
            account,
            isPayment
                ? isCreditor
                    ? `recorded a payment of ${rs(input.amount)} to ${account.name}`
                    : `recorded ${rs(input.amount)} received from ${account.name}`
                : isCreditor
                  ? `added a bill of ${rs(input.amount)} from ${account.name}`
                  : `added ${rs(input.amount)} owed by ${account.name}`,
            { entryId: String(entry!._id), amount: input.amount, date: input.date, method: input.method ?? "", reference: input.reference ?? "", note: input.note ?? "", balanceAfter },
        );
        return toEntryDTO(entry as unknown as EntryLike);
    });
}

export async function voidEntry(entryId: string, input: VoidEntryInput, actor: ActorDTO): Promise<EntryDTO> {
    assertId(entryId, "Entry");
    const entry = await AccountEntry.findById(entryId);
    if (!entry) throw ApiError.notFound("Entry not found");
    if (entry.void) throw ApiError.conflict(`Already voided by ${entry.void.by?.name ?? "someone"}.`);
    const account = await Account.findById(entry.accountId);
    if (!account) throw ApiError.notFound("Account not found");

    return inTransaction(async (session) => {
        entry.void = { at: new Date(), by: actor, reason: input.reason };
        await entry.save({ session });
        const t = (await totalsFor([account._id], session)).get(String(account._id));
        await log(
            session,
            actor,
            AuditAction.EntryVoid,
            account,
            `voided ${entry.type === EntryType.Payment ? "the payment" : "the entry"} of ${rs(entry.amount)} (${entry.date}) on ${account.name} — "${input.reason}"`,
            { entryId, amount: entry.amount, type: entry.type, date: entry.date, reason: input.reason, originalBy: entry.createdBy, balanceAfter: round2((t?.billed ?? 0) - (t?.paid ?? 0)) },
        );
        return toEntryDTO(entry as unknown as EntryLike);
    });
}

// ---- activity log ---------------------------------------------------------------------------------------

export async function getActivity(q: ActivityQuery): Promise<ActivityPageDTO> {
    const filter: Record<string, unknown> = {};
    if (q.user) filter["actor.id"] = q.user;
    if (q.action) filter.action = q.action;
    if (q.accountId) filter.accountId = q.accountId;
    const at: Record<string, Date> = {};
    if (q.from) at.$gte = new Date(`${q.from}T00:00:00`);
    if (q.to) at.$lte = new Date(`${q.to}T23:59:59.999`);
    if (q.before) {
        const b = new Date(q.before);
        if (!Number.isNaN(b.getTime())) at.$lt = b;
    }
    if (Object.keys(at).length) filter.at = at;

    const [rows, actorsAgg] = await Promise.all([
        AuditLog.find(filter).sort({ at: -1 }).limit(q.limit + 1).lean(),
        AuditLog.aggregate<{ _id: string; name: string; phone: string }>([
            { $sort: { at: -1 } },
            { $group: { _id: "$actor.id", name: { $first: "$actor.name" }, phone: { $first: "$actor.phone" } } },
            { $sort: { name: 1 } },
        ]),
    ]);
    const page = rows.slice(0, q.limit);
    return {
        items: page.map((a) => toAuditDTO(a as unknown as AuditLike)),
        nextBefore: rows.length > q.limit ? (page[page.length - 1]!.at as Date).toISOString() : null,
        actors: actorsAgg.map((a) => ({ id: a._id, name: a.name, phone: a.phone })),
    };
}

// ---- summary ----------------------------------------------------------------------------------------------

export async function getSummary(): Promise<AccountsSummaryDTO> {
    const accounts = await listAccounts(undefined, false);
    const today = todayIso();
    const side = (kind: AccountKind) => {
        const rows = accounts.filter((a) => a.kind === kind && a.balance > 0);
        return {
            total: round2(rows.reduce((s, a) => s + a.balance, 0)),
            count: rows.length,
            overdue: round2(rows.filter((a) => a.dueDate && a.dueDate < today).reduce((s, a) => s + a.balance, 0)),
        };
    };
    const payable = side(AccountKind.Creditor);
    const receivable = side(AccountKind.Debtor);
    const month = today.slice(0, 7);
    const flows = await AccountEntry.aggregate<{ _id: string; total: number }>([
        { $match: { type: EntryType.Payment, void: null, date: { $gte: `${month}-01`, $lte: `${month}-31` } } },
        { $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "a" } },
        { $unwind: "$a" },
        { $group: { _id: "$a.kind", total: { $sum: "$amount" } } },
    ]);
    const flow = (k: AccountKind) => round2(flows.find((f) => f._id === k)?.total ?? 0);
    return {
        payable,
        receivable,
        net: round2(receivable.total - payable.total),
        thisMonth: { paidOut: flow(AccountKind.Creditor), collected: flow(AccountKind.Debtor) },
        emailConfigured: isEmailConfigured(),
    };
}

// ---- reminders ------------------------------------------------------------------------------------------

export async function sendReminder(
    accountId: string,
    input: SendReminderInput,
    actor: ActorDTO,
): Promise<{ channel: ReminderChannel; to: string; url?: string; messageId?: string }> {
    assertId(accountId, "Account");
    const account = await Account.findById(accountId);
    if (!account) throw ApiError.notFound("Account not found");
    if (account.kind !== AccountKind.Debtor) throw ApiError.badRequest("Reminders are only for debtors — people who owe you.");
    const t = (await totalsFor([account._id])).get(String(account._id));
    const balance = round2((t?.billed ?? 0) - (t?.paid ?? 0));
    if (balance <= 0) throw ApiError.badRequest(`Nothing is pending from ${account.name}.`);

    if (input.channel === ReminderChannel.Email) {
        if (!account.email) throw ApiError.badRequest("No email address", { email: `Add an email address for ${account.name} first` });
        const subject = input.subject?.trim() || `Payment reminder — ${rs(balance)} pending`;
        try {
            const { messageId } = await sendEmail({ to: account.email, subject, text: input.message });
            await log(null, actor, AuditAction.ReminderEmail, account, `emailed a payment reminder to ${account.name} (${rs(balance)} pending)`, {
                to: account.email, subject, message: input.message, status: "sent", messageId, balance,
            });
            return { channel: ReminderChannel.Email, to: account.email, messageId };
        } catch (err) {
            // A failed attempt is still worth knowing about — but only if email is set up at all.
            if (isEmailConfigured()) {
                await log(null, actor, AuditAction.ReminderEmail, account, `tried to email a reminder to ${account.name} but it failed`, {
                    to: account.email, subject, status: "failed", balance, error: err instanceof Error ? err.message : String(err),
                });
            }
            throw err;
        }
    }

    const url = whatsappLink(account.phone, input.message);
    if (!url) throw ApiError.badRequest("No valid phone number", { phone: `Add a valid mobile number for ${account.name} first` });
    await log(null, actor, AuditAction.ReminderWhatsapp, account, `opened a WhatsApp reminder for ${account.name} (${rs(balance)} pending)`, {
        to: account.phone, message: input.message, status: "opened", balance,
    });
    return { channel: ReminderChannel.Whatsapp, to: account.phone, url };
}

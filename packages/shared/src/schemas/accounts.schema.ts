// src/schemas/accounts.schema.ts — creditors, debtors, their payment ledgers and the activity log.
import { z } from "zod";
import { AccountKind, AuditAction, EntryType, PaymentMethod, ReminderChannel } from "../enums.js";
import { objectIdSchema } from "./common.schema.js";
import { isoDateSchema } from "./staff.schema.js";

const kindSchema = z.enum(Object.values(AccountKind) as [AccountKind, ...AccountKind[]]);
const entryTypeSchema = z.enum(Object.values(EntryType) as [EntryType, ...EntryType[]]);
const methodSchema = z.enum(Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]]);
const channelSchema = z.enum(Object.values(ReminderChannel) as [ReminderChannel, ...ReminderChannel[]]);

const optionalDate = z.union([isoDateSchema, z.literal("")]);
const optionalEmail = z.union([z.string().trim().max(160).pipe(z.email("Enter a valid email address")), z.literal("")]);
const money = (label: string) => z.number({ error: `${label} must be a number` }).positive(`${label} must be more than 0`).max(10_000_000_000);

export const accountListQuerySchema = z.object({
    kind: kindSchema.optional(),
    /** "true" to include archived accounts too. */
    archived: z.enum(["true", "false"]).optional(),
});
export type AccountListQuery = z.infer<typeof accountListQuerySchema>;

// ---- accounts -------------------------------------------------------------------------------------------

const accountFields = {
    name: z.string().trim().min(1, "Name is required").max(120),
    group: z.string().trim().max(80),
    phone: z.string().trim().max(20),
    email: optionalEmail,
    notes: z.string().trim().max(1000),
    dueDate: optionalDate,
};

export const createAccountSchema = z
    .object({
        ...accountFields,
        kind: kindSchema,
        /** What is already owed today; becomes the first "Opening balance" entry in the ledger. */
        openingBalance: z.number().min(0).max(10_000_000_000),
    })
    .partial()
    .required({ name: true, kind: true });
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z
    .object({
        ...accountFields,
        active: z.boolean(),
        /** The `updatedAt` the editor was looking at — a mismatch means someone else changed it meanwhile. */
        expectedUpdatedAt: z.string(),
    })
    .partial();
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// ---- ledger entries ---------------------------------------------------------------------------------------

export const createEntrySchema = z.object({
    type: entryTypeSchema,
    amount: money("Amount"),
    date: isoDateSchema,
    method: methodSchema.optional(),
    reference: z.string().trim().max(60).optional(),
    note: z.string().trim().max(500).optional(),
});
export type CreateEntryInput = z.infer<typeof createEntrySchema>;

export const voidEntrySchema = z.object({
    reason: z.string().trim().min(3, "Say why (at least a few words)").max(300),
});
export type VoidEntryInput = z.infer<typeof voidEntrySchema>;

// ---- reminders ------------------------------------------------------------------------------------------

export const sendReminderSchema = z.object({
    channel: channelSchema,
    message: z.string().trim().min(5, "Write a message").max(2000),
    /** Email only. */
    subject: z.string().trim().max(150).optional(),
});
export type SendReminderInput = z.infer<typeof sendReminderSchema>;

// ---- activity log ---------------------------------------------------------------------------------------

export const activityQuerySchema = z.object({
    user: z.string().max(40).optional(),
    action: z.enum(Object.values(AuditAction) as [AuditAction, ...AuditAction[]]).optional(),
    accountId: objectIdSchema.optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    /** Cursor: only entries older than this ISO timestamp. */
    before: z.string().max(40).optional(),
});
export type ActivityQuery = z.infer<typeof activityQuerySchema>;

// ---- what the API returns ---------------------------------------------------------------------------------

export interface ActorDTO {
    id: string;
    name: string;
    phone: string;
}

export interface AccountDTO {
    id: string;
    name: string;
    kind: AccountKind;
    group: string;
    phone: string;
    email: string;
    notes: string;
    dueDate: string;
    active: boolean;
    createdBy: ActorDTO;
    updatedBy: ActorDTO;
    createdAt: string;
    updatedAt: string;
    /** All charges (bills / advances) minus none — the total that has ever been owed. */
    billed: number;
    /** All payments received or made. */
    paid: number;
    /** billed − paid: what is still outstanding. */
    balance: number;
    entryCount: number;
    lastPayment: { date: string; amount: number; at: string; by: ActorDTO } | null;
    lastReminder: { at: string; channel: ReminderChannel; by: ActorDTO } | null;
}

export interface EntryDTO {
    id: string;
    accountId: string;
    type: EntryType;
    amount: number;
    date: string;
    method: PaymentMethod | "";
    reference: string;
    note: string;
    createdBy: ActorDTO;
    createdAt: string;
    void: { at: string; by: ActorDTO; reason: string } | null;
}

export interface AuditDTO {
    id: string;
    at: string;
    actor: ActorDTO;
    action: AuditAction;
    accountId: string | null;
    accountName: string;
    /** A readable sentence: 'recorded a payment of ₹50,000 to NSE'. */
    summary: string;
    data: Record<string, unknown>;
}

export interface AccountDetailDTO {
    account: AccountDTO;
    entries: EntryDTO[];
    activity: AuditDTO[];
}

export interface ActivityPageDTO {
    items: AuditDTO[];
    /** Pass as `before` to load older entries; null when there are no more. */
    nextBefore: string | null;
    /** Everyone who appears in the log (for the "who" filter). */
    actors: ActorDTO[];
}

export interface AccountsSummaryDTO {
    payable: { total: number; count: number; overdue: number };
    receivable: { total: number; count: number; overdue: number };
    /** receivable − payable. */
    net: number;
    thisMonth: { paidOut: number; collected: number };
    emailConfigured: boolean;
}

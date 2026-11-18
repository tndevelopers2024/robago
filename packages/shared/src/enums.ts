// src/enums.ts
//
// NOTE: these are plain `as const` object unions, not TypeScript `enum` declarations.
// regraft's tsconfig.app.json (mirrored in ../../tsconfig.base.json) sets
// `erasableSyntaxOnly: true`, which forbids `enum` because it emits a runtime object
// the TS compiler can't simply erase. The const-object + derived-union-type pattern
// below is the erasable equivalent — value union for runtime checks (`UserRole.SuperAdmin`),
// type union for type positions (`UserRole` as a type).

export const UserRole = {
    /** Full access: staff, salaries, expenses, accounts, user management and everything inventory. */
    SuperAdmin: "superadmin",
    /** Inventory only: stock, transactions and the product catalogue they need. */
    Manager: "manager",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ProductType = {
    RawMaterial: "RawMaterial",
    FinishedProduct: "FinishedProduct",
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const Unit = {
    Roll: "Roll",
    Piece: "Piece",
    Packet: "Packet",
    Metre: "Metre",
} as const;
export type Unit = (typeof Unit)[keyof typeof Unit];

export const TransactionType = {
    Purchase: "Purchase",
    Sale: "Sale",
    Production: "Production",
    Consumption: "Consumption",
    Adjustment: "Adjustment",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

// The 8 fixed tag colors used across Category / Warehouse / Supplier / ProductionUnit,
// reverse-engineered from the legacy app's Drizzle schema (robago-prd.md §5).
export const TagColor = {
    Lavendar: "#C1A3C3",
    Peach: "#FFCBA4",
    Sky: "#A0C4FF",
    Coral: "#FFB6A1",
    Green: "#D1E6B1",
    Pink: "#FFC0CB",
    Yellow: "#FFD580",
    Teal: "#99D6D0",
} as const;
export type TagColor = (typeof TagColor)[keyof typeof TagColor] | (string & {});

/** Ordered list for rendering color-swatch pickers, so UI order is deterministic. */
export const TAG_COLOR_OPTIONS: ReadonlyArray<{ label: string; value: TagColor }> = [
    { label: "Lavendar", value: TagColor.Lavendar },
    { label: "Peach", value: TagColor.Peach },
    { label: "Sky", value: TagColor.Sky },
    { label: "Coral", value: TagColor.Coral },
    { label: "Green", value: TagColor.Green },
    { label: "Pink", value: TagColor.Pink },
    { label: "Yellow", value: TagColor.Yellow },
    { label: "Teal", value: TagColor.Teal },
];

export const AttendanceStatus = {
    Present: "P",
    Absent: "A",
    Half: "H",
    Leave: "L",
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

/** Whether an employee has a phone we can reach (the Yes / No "Phone" column on the salary sheet). */
export const PhoneStatus = {
    Yes: "yes",
    No: "no",
    Unknown: "unknown",
} as const;
export type PhoneStatus = (typeof PhoneStatus)[keyof typeof PhoneStatus];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const ExpenseType = {
    General: "General",
    Operational: "Operational",
} as const;
export type ExpenseType = (typeof ExpenseType)[keyof typeof ExpenseType];

/** A creditor is someone we must pay; a debtor is someone who must pay us. */
export const AccountKind = {
    Creditor: "creditor",
    Debtor: "debtor",
} as const;
export type AccountKind = (typeof AccountKind)[keyof typeof AccountKind];

/** A "charge" raises what is owed (a bill, an advance given); a "payment" lowers it. */
export const EntryType = {
    Charge: "charge",
    Payment: "payment",
} as const;
export type EntryType = (typeof EntryType)[keyof typeof EntryType];

export const PaymentMethod = {
    Cash: "cash",
    Bank: "bank",
    Upi: "upi",
    Cheque: "cheque",
    Other: "other",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ReminderChannel = {
    Email: "email",
    Whatsapp: "whatsapp",
} as const;
export type ReminderChannel = (typeof ReminderChannel)[keyof typeof ReminderChannel];

export const AuditAction = {
    AccountCreate: "account.create",
    AccountUpdate: "account.update",
    AccountArchive: "account.archive",
    AccountRestore: "account.restore",
    EntryCharge: "entry.charge",
    EntryPayment: "entry.payment",
    EntryVoid: "entry.void",
    ReminderEmail: "reminder.email",
    ReminderWhatsapp: "reminder.whatsapp",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

// ---- CRM: school visits -------------------------------------------------------------------------------

/** Which board a school follows. Matric = Tamil Nadu Matriculation (state board, private). */
export const SchoolBoard = {
    CBSE: "cbse",
    ICSE: "icse",
    Matric: "matric",
    State: "state",
    Other: "other",
} as const;
export type SchoolBoard = (typeof SchoolBoard)[keyof typeof SchoolBoard];

/** Where a school is in our pipeline. "Prospect" = not approached yet. */
export const SchoolStage = {
    Prospect: "prospect",
    Visited: "visited",
    Sampled: "sampled", // sample / quotation sent
    Negotiating: "negotiating", // near confirmation, talks on
    Confirmed: "confirmed", // order confirmed
    Lost: "lost", // not interested / buying elsewhere
} as const;
export type SchoolStage = (typeof SchoolStage)[keyof typeof SchoolStage];

/** How a prospect got into the list. */
export const SchoolSource = {
    Web: "web", // found online — board and details still to be confirmed
    Manual: "manual", // added by one of us
} as const;
export type SchoolSource = (typeof SchoolSource)[keyof typeof SchoolSource];

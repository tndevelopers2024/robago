// src/models/Accounts.model.ts — creditors & debtors, their payment ledgers, and the activity log.
import { Schema, model } from "mongoose";
import { AccountKind, AuditAction, EntryType, PaymentMethod } from "@robago/shared";

/** Who did something. A snapshot — it must stay readable even if the user is later renamed or removed. */
const actorSchema = new Schema({ id: String, name: String, phone: String }, { _id: false });

// A person or business we owe money to (creditor) or who owes us (debtor).
const accountSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        nameKey: { type: String, required: true }, // lower-cased, to keep names unique within a kind
        kind: { type: String, enum: Object.values(AccountKind), required: true },
        group: { type: String, default: "" },
        phone: { type: String, default: "" },
        email: { type: String, default: "" },
        notes: { type: String, default: "" },
        dueDate: { type: String, default: "" }, // YYYY-MM-DD or ""
        active: { type: Boolean, default: true },
        createdBy: { type: actorSchema, required: true },
        updatedBy: { type: actorSchema, required: true },
    },
    { timestamps: true },
);
accountSchema.index({ kind: 1, nameKey: 1 }, { unique: true });

// Append-only ledger. The balance is never stored — it is always worked out from these rows, so two
// people recording payments at the same moment can never overwrite each other.
const entrySchema = new Schema(
    {
        accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        type: { type: String, enum: Object.values(EntryType), required: true },
        amount: { type: Number, required: true, min: 0 },
        date: { type: String, required: true }, // YYYY-MM-DD the money moved
        method: { type: String, enum: [...Object.values(PaymentMethod), ""], default: "" },
        reference: { type: String, default: "" },
        note: { type: String, default: "" },
        createdBy: { type: actorSchema, required: true },
        // Mistakes are voided, never deleted: the row stays, struck through, with who and why.
        void: {
            type: new Schema({ at: Date, by: actorSchema, reason: String }, { _id: false }),
            default: null,
        },
    },
    { timestamps: true },
);
entrySchema.index({ accountId: 1, date: -1, createdAt: -1 });

// Everything anyone does in this module, newest first.
const auditSchema = new Schema({
    at: { type: Date, required: true, default: () => new Date() },
    actor: { type: actorSchema, required: true },
    action: { type: String, enum: Object.values(AuditAction), required: true },
    accountId: { type: Schema.Types.ObjectId, default: null },
    accountName: { type: String, default: "" },
    summary: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
});
auditSchema.index({ at: -1 });
auditSchema.index({ accountId: 1, at: -1 });
auditSchema.index({ "actor.id": 1, at: -1 });

export const Account = model("Account", accountSchema);
export const AccountEntry = model("AccountEntry", entrySchema);
export const AuditLog = model("AuditLog", auditSchema);

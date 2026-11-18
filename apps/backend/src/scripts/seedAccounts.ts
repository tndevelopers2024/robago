// src/scripts/seedAccounts.ts
//
// Loads the creditors and debtors from the client's sheet (₹73,82,774.50 to pay, ₹1,05,02,310.55 to
// collect). It NEVER touches anything else, and refuses to run if any account already exists, so it
// can't overwrite real entries.   Usage:  pnpm seed:accounts
import { connectDB, disconnectDB } from "../config/db.js";
import { Account, AccountEntry, AuditLog } from "../models/Accounts.model.js";
import { AccountKind, CREDITORS_SAMPLE, DEBTORS_SAMPLE, EntryType, AuditAction, type AccountSampleRow } from "@robago/shared";

const SYSTEM = { id: "system", name: "Import from sheet", phone: "" };
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

async function load(kind: AccountKind, rows: AccountSampleRow[]) {
    for (const r of rows) {
        const acc = await Account.create({
            name: r.name,
            nameKey: r.name.toLowerCase(),
            kind,
            dueDate: r.dueDate ?? "",
            createdBy: SYSTEM,
            updatedBy: SYSTEM,
        });
        await AccountEntry.create({ accountId: acc._id, type: EntryType.Charge, amount: r.balance, date: today(), note: "Opening balance from the old sheet", createdBy: SYSTEM });
        await AuditLog.create({
            actor: SYSTEM,
            action: AuditAction.AccountCreate,
            accountId: acc._id,
            accountName: acc.name,
            summary: `imported ${kind} "${r.name}" with ₹${r.balance.toLocaleString("en-IN")} outstanding`,
            data: { kind, openingBalance: r.balance },
        });
    }
}

async function main() {
    await connectDB();
    const existing = await Account.countDocuments();
    if (existing > 0) {
        console.log(`Skipped: ${existing} accounts already exist. This script only loads into an empty accounts list.`);
        return;
    }
    await load(AccountKind.Creditor, CREDITORS_SAMPLE);
    await load(AccountKind.Debtor, DEBTORS_SAMPLE);
    console.log(`Loaded ${CREDITORS_SAMPLE.length} creditors and ${DEBTORS_SAMPLE.length} debtors.`);
}

main()
    .catch((err) => {
        console.error("Accounts seed failed:", err);
        process.exitCode = 1;
    })
    .finally(disconnectDB);

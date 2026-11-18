// src/scripts/seedExpenses.ts
//
// Expense heads (Tea, Electricity …) are created automatically the first time Expenses is opened,
// so this script is only for loading SAMPLE amounts to try the charts:
//     pnpm seed:expenses --sample
// Sample rows are tagged "Sample" in the note. It refuses to run if any expense already exists
// (so it can't mix with real entries); --force removes only rows tagged "Sample" first.
import { connectDB, disconnectDB } from "../config/db.js";
import { Expense } from "../models/Expense.model.js";
import { buildSampleExpenses } from "@robago/shared";
import { listItems } from "../services/expense.service.js";

async function main() {
    const sample = process.argv.includes("--sample");
    const force = process.argv.includes("--force");
    await connectDB();
    const items = await listItems(); // also creates the default heads on first run
    console.log(`Expense heads ready: ${items.length}`);
    if (!sample) return;

    if (await Expense.exists({ note: { $ne: "Sample" } })) {
        console.log("Skipped: real expenses already exist; sample data is only for an empty expense log.");
        return;
    }
    if (await Expense.exists({ note: "Sample" })) {
        if (!force) return console.log("Skipped: sample data already loaded. Use --force to reload it.");
        await Expense.deleteMany({ note: "Sample" });
    }

    const docs = buildSampleExpenses(items);
    await Expense.insertMany(docs);
    console.log(`Loaded ${docs.length} sample expenses across 6 months.`);
}

main()
    .catch((err) => {
        console.error("Expense seed failed:", err);
        process.exitCode = 1;
    })
    .finally(disconnectDB);

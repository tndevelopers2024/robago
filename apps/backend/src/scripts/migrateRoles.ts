// src/scripts/migrateRoles.ts
//
// One-time, safe to repeat: renames the old roles in the database.
//     admin → superadmin        user → manager
// Only the `role` field of existing users is touched. Everyone must log in again afterwards, because
// their old login token still carries the old role name.   Usage:  pnpm migrate:roles
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.model.js";

async function main() {
    await connectDB();
    const users = User.collection; // raw collection: the old values are no longer valid enum values
    const a = await users.updateMany({ role: "admin" }, { $set: { role: "superadmin" } });
    const m = await users.updateMany({ role: "user" }, { $set: { role: "manager" } });
    console.log(`admin → superadmin: ${a.modifiedCount} | user → manager: ${m.modifiedCount}`);
    const all = await users.find({}, { projection: { name: 1, phoneNumber: 1, role: 1 } }).toArray();
    for (const u of all) console.log(`  ${String(u.name).padEnd(22)} ${String(u.phoneNumber).padEnd(12)} ${u.role}`);
    if (!all.some((u) => u.role === "superadmin")) console.warn("⚠ There is no super admin! Promote someone before logging out.");
}

main()
    .catch((err) => {
        console.error("Role migration failed:", err);
        process.exitCode = 1;
    })
    .finally(disconnectDB);

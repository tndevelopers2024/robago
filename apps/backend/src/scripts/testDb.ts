// src/scripts/testDb.ts
import { connectDB, disconnectDB } from "../config/db.js";

async function main() {
    console.log("Connecting to MongoDB via configured MONGO_URI...");
    try {
        await connectDB();
        console.log("✅ Successfully connected to MongoDB database!");
        await disconnectDB();
        console.log("Connection closed cleanly.");
    } catch (err: unknown) {
        const error = err as Error;
        console.error("\n❌ Connection test failed:", error.message);
        
        let publicIp = "Unable to detect";
        try {
            const res = await fetch("https://api.ipify.org?format=json");
            const data = (await res.json()) as { ip: string };
            publicIp = data.ip;
        } catch {
            // ignore
        }

        console.error("\n========================================================");
        console.error("👉 IP WHITELIST REQUIRED ON MONGODB ATLAS:");
        console.error(`Your current public IP address is: ${publicIp}`);
        console.error("1. Go to https://cloud.mongodb.com/");
        console.error("2. Navigate to: Security -> Network Access -> IP Access List");
        console.error(`3. Click 'Add IP Address' -> Add '${publicIp}' (or '0.0.0.0/0' to allow access from anywhere).`);
        console.error("4. Wait 30-60 seconds for the rule to become Active, then re-run:");
        console.error("   pnpm run test:db");
        console.error("========================================================\n");
        process.exit(1);
    }
}

main();

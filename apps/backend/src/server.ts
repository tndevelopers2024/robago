// src/server.ts
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

async function main() {
    await connectDB();
    const app = createApp();
    app.listen(env.PORT, () => {
        console.log(`Robago backend listening on port ${env.PORT} (${env.NODE_ENV})`);
    });
}

main().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});

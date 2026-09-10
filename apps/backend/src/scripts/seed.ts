import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

async function seed() {
    console.log("Connecting to MongoDB:", env.MONGO_URI.replace(/:([^:@]+)@/, ":****@"));
    await mongoose.connect(env.MONGO_URI);

    const usersCollection = mongoose.connection.db!.collection("users");

    const usersToSeed = [
        {
            phoneNumber: "1234567890",
            name: "Admin User",
            role: "admin",
            passcode: "123456",
        },
        {
            phoneNumber: "9500088697",
            name: "Default Admin",
            role: "admin",
            passcode: "123456",
        },
    ];

    for (const u of usersToSeed) {
        const passwordHash = await bcrypt.hash(u.passcode, 10);
        await usersCollection.findOneAndUpdate(
            { phoneNumber: u.phoneNumber },
            {
                $set: {
                    phoneNumber: u.phoneNumber,
                    name: u.name,
                    role: u.role,
                    passwordHash,
                    tokenVersion: 0,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            { upsert: true },
        );
        console.log(`Seeded user: ${u.name} (Phone: ${u.phoneNumber}, Passcode: ${u.passcode})`);
    }

    await mongoose.disconnect();
    console.log("Seeding complete!");
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});

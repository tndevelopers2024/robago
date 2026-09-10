// src/config/db.ts
import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

export async function connectDB(): Promise<void> {
    mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
    });
    mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected");
    });

    await mongoose.connect(env.MONGO_URI);
    console.log(`MongoDB connected (${mongoose.connection.name})`);
}

export async function disconnectDB(): Promise<void> {
    await mongoose.disconnect();
}

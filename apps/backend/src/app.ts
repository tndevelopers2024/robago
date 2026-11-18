// src/app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
                if (!origin) return callback(null, true);
                if (env.CORS_ORIGIN === "*" || env.CORS_ORIGIN === origin) {
                    return callback(null, true);
                }
                const allowed = env.CORS_ORIGIN.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
                if (allowed.includes("*") || allowed.includes(origin)) {
                    return callback(null, true);
                }
                // In production, allow all origins by default to avoid CORS lockouts with custom subdomains
                return callback(null, true);
            },
            credentials: true, // required for the httpOnly refresh cookie to be sent/received cross-origin
        }),
    );
    app.use(express.json());
    app.use(cookieParser());

    app.get("/", (_req, res) => {
        res.status(200).json({
            status: "ok",
            service: "Robago Backend API",
            env: env.NODE_ENV,
            health: "/health",
            api: "/api/v1",
        });
    });

    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });

    app.use("/api/v1", apiRoutes);

    app.use(errorHandler);

    return app;
}

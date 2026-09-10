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
            origin: env.CORS_ORIGIN,
            credentials: true, // required for the httpOnly refresh cookie to be sent/received cross-origin
        }),
    );
    app.use(express.json());
    app.use(cookieParser());

    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });

    app.use("/api/v1", apiRoutes);

    app.use(errorHandler);

    return app;
}

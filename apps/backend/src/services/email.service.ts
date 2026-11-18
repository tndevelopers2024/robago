// src/services/email.service.ts — sends email through whatever SMTP server is configured.
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

let cached: Transporter | null = null;

export function isEmailConfigured(): boolean {
    return Boolean(env.SMTP_HOST && env.EMAIL_FROM);
}

function transport(): Transporter {
    if (!cached) {
        cached = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE === "true",
            ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } } : {}),
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 15_000,
        });
    }
    return cached;
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function sendEmail(opts: { to: string; subject: string; text: string }): Promise<{ messageId: string }> {
    if (!isEmailConfigured()) {
        throw new ApiError(
            503,
            "Email isn't set up on the server yet. Ask whoever manages the server to add the SMTP settings (see .env.example) — or send this one on WhatsApp.",
        );
    }
    try {
        const info = await transport().sendMail({
            from: env.EMAIL_FROM,
            to: opts.to,
            ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
            subject: opts.subject.replace(/[\r\n]+/g, " ").trim(), // never let a subject inject extra headers
            text: opts.text,
            html: `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.6;color:#0f172a;white-space:pre-wrap">${escapeHtml(opts.text)}</div>`,
        });
        return { messageId: String(info.messageId) };
    } catch (err) {
        console.error("Email send failed:", err);
        throw new ApiError(502, `The email couldn't be sent (${err instanceof Error ? err.message : "unknown error"}).`);
    }
}

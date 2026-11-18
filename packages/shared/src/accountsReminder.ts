// src/accountsReminder.ts — the wording of a payment reminder, and WhatsApp links. Shared so the preview
// the person edits is exactly what the server would have written.

export interface ReminderContext {
    name: string;
    balance: number;
    /** YYYY-MM-DD or "" */
    dueDate: string;
    senderName: string;
    company: string;
    lastPayment?: { date: string; amount: number } | null;
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const rs = (n: number) => `Rs. ${inr.format(n)}`;
const longDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

export function buildReminderSubject(ctx: Pick<ReminderContext, "balance" | "company">): string {
    return `Payment reminder from ${ctx.company} — ${rs(ctx.balance)} pending`;
}

export function buildReminderMessage(ctx: ReminderContext): string {
    const lines = [`Dear ${ctx.name},`, "", `This is a gentle reminder that ${rs(ctx.balance)} is pending with ${ctx.company}.`];
    if (ctx.lastPayment) lines.push(`We last received ${rs(ctx.lastPayment.amount)} on ${longDate(ctx.lastPayment.date)}. Thank you.`);
    if (ctx.dueDate) lines.push(`Kindly arrange the payment by ${longDate(ctx.dueDate)}.`);
    else lines.push("Kindly arrange the payment at your earliest convenience.");
    lines.push("", "If you have already paid, please ignore this message and share the payment details with us.", "", "Thank you,", ctx.senderName, ctx.company);
    return lines.join("\n");
}

/** Digits only, with India's +91 added to a plain 10-digit mobile number. Null if it can't be a phone number. */
export function whatsappNumber(phone: string): string | null {
    const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length === 10) return `91${digits}`;
    if (digits.length >= 11 && digits.length <= 15) return digits;
    return null;
}

/** A wa.me link that opens WhatsApp with the message ready to send. */
export function whatsappLink(phone: string, message: string): string | null {
    const n = whatsappNumber(phone);
    return n ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : null;
}

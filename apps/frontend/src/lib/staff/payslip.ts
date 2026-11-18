// src/lib/staff/payslip.ts — builds a one-page A4 payslip PDF in the browser.
// jsPDF's built-in fonts have no ₹ glyph, so amounts are printed as "Rs." (standard on payslips).
import { format, parseISO } from "date-fns";
import { formatNumber, pairKey } from "./calc";
import type { AttendanceSummary, SalarySummary } from "./calc";
import type { Employee, PaymentRecord } from "./types";

export interface PayslipInput {
    emp: Employee;
    month: Date;
    summary: SalarySummary;
    attendance: AttendanceSummary;
    weeks: string[];
    advances: Record<string, number>;
    payment?: PaymentRecord;
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const rs = (n: number) => `${n < 0 ? "-" : ""}Rs. ${inr.format(Math.abs(n))}`;

const NAVY: [number, number, number] = [15, 23, 42];
const CYAN: [number, number, number] = [14, 165, 233];
const INK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];

export async function downloadPayslip(input: PayslipInput): Promise<void> {
    const { jsPDF } = await import("jspdf"); // loaded only when someone asks for a payslip
    const { emp, month, summary, attendance, weeks, advances, payment } = input;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const M = 16;
    const monthLabel = format(month, "MMMM yyyy");
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const text = (
        s: string,
        x: number,
        y: number,
        opts?: {
            size?: number;
            bold?: boolean;
            color?: [number, number, number];
            align?: "left" | "right" | "center";
        },
    ) => {
        doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
        doc.setFontSize(opts?.size ?? 10);
        doc.setTextColor(...(opts?.color ?? INK));
        doc.text(s, x, y, { align: opts?.align ?? "left" });
    };
    const rule = (y: number, color = LINE) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.25);
        doc.line(M, y, W - M, y);
    };

    // Header band
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 34, "F");
    doc.setFillColor(...CYAN);
    doc.rect(0, 34, W, 1.4, "F");
    text("ROBAGO", M, 17, { size: 20, bold: true, color: [255, 255, 255] });
    text("Techienutpam Pvt. Ltd.", M, 24, { size: 9, color: [148, 163, 184] });
    text("PAYSLIP", W - M, 16, {
        size: 11,
        bold: true,
        color: [125, 211, 252],
        align: "right",
    });
    text(monthLabel, W - M, 25, {
        size: 16,
        bold: true,
        color: [255, 255, 255],
        align: "right",
    });

    // Employee block
    let y = 48;
    text(emp.name, M, y, { size: 16, bold: true });
    const role = [emp.designation, emp.department].filter(Boolean).join(" · ");
    if (role) text(role, M, y + 6, { size: 10, color: MUTED });

    const paid = Boolean(payment);
    if (paid) doc.setFillColor(220, 252, 231);
    else doc.setFillColor(254, 243, 199);
    doc.roundedRect(W - M - 34, y - 7, 34, 10, 2, 2, "F");
    text(paid ? "PAID" : "PAYMENT PENDING", W - M - 17, y - 0.6, {
        size: 8.5,
        bold: true,
        color: paid ? [21, 128, 61] : [161, 98, 7],
        align: "center",
    });

    y += 16;
    const info: [string, string][] = [
        ["Pay period", `${format(first, "d MMM yyyy")} – ${format(last, "d MMM yyyy")}`],
        ["Joined on", emp.joinedOn ? format(parseISO(emp.joinedOn), "d MMM yyyy") : "—"],
        ["Bank account", emp.bankAccount ? `XXXXXX${emp.bankAccount.slice(-4)}` : "—"],
        ["Days worked", `${formatNumber(attendance.workedDays)}`],
    ];
    info.forEach(([k, v], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = M + col * 92;
        text(k.toUpperCase(), x, y + row * 11, {
            size: 7.5,
            bold: true,
            color: MUTED,
        });
        text(v, x, y + 5 + row * 11, { size: 10 });
    });

    // Attendance strip
    y += 28;
    const boxes: [string, number][] = [
        ["Present", attendance.present],
        ["Half day", attendance.half],
        ["Absent", attendance.absent],
        ["Leave", attendance.leave],
        ["Pay-cut days", summary.leaveDays],
    ];
    const bw = (W - 2 * M - 4 * 3) / 5;
    boxes.forEach(([label, value], i) => {
        const x = M + i * (bw + 3);
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(x, y, bw, 15, 2, 2, "F");
        text(formatNumber(value), x + bw / 2, y + 7, {
            size: 13,
            bold: true,
            align: "center",
        });
        text(label, x + bw / 2, y + 12, {
            size: 7.5,
            color: MUTED,
            align: "center",
        });
    });

    // Earnings / deductions table
    y += 26;
    doc.setFillColor(...NAVY);
    doc.rect(M, y, W - 2 * M, 8, "F");
    text("DESCRIPTION", M + 3, y + 5.4, {
        size: 8.5,
        bold: true,
        color: [255, 255, 255],
    });
    text("AMOUNT", W - M - 3, y + 5.4, {
        size: 8.5,
        bold: true,
        color: [255, 255, 255],
        align: "right",
    });
    y += 8;

    const section = (title: string) => {
        y += 7;
        text(title, M + 3, y, { size: 8.5, bold: true, color: CYAN });
        y += 2.5;
    };
    const line = (label: string, amount: string, color: [number, number, number] = INK) => {
        y += 6.5;
        text(label, M + 3, y);
        text(amount, W - M - 3, y, { align: "right", color });
        rule(y + 2.2);
    };

    section("EARNINGS");
    line("Monthly salary", rs(summary.salary));

    section("DEDUCTIONS");
    let anyAdvance = false;
    for (const w of weeks) {
        const a = advances[pairKey(emp.id, w)];
        if (!a) continue;
        anyAdvance = true;
        line(`Advance given — week of ${format(parseISO(w), "d MMM")}`, `- ${rs(a)}`);
    }
    if (!anyAdvance) line("Advances", "- Rs. 0");
    line(
        `Leave deduction (${formatNumber(summary.leaveDays)} ${summary.leaveDays === 1 ? "day" : "days"} x ${rs(Math.round(summary.perDay))})`,
        `- ${rs(summary.leaveDeduction)}`,
        summary.leaveDeduction ? [185, 28, 28] : INK,
    );
    line("Total deductions", `- ${rs(summary.advanceTotal + summary.leaveDeduction)}`, MUTED);

    // Net pay
    y += 10;
    doc.setFillColor(...NAVY);
    doc.roundedRect(M, y, W - 2 * M, 18, 3, 3, "F");
    text("NET PAY", M + 6, y + 7.5, {
        size: 8.5,
        bold: true,
        color: [125, 211, 252],
    });
    text(`${monthLabel}`, M + 6, y + 13, { size: 9, color: [148, 163, 184] });
    text(rs(summary.balance), W - M - 6, y + 11.5, {
        size: 18,
        bold: true,
        color: [255, 255, 255],
        align: "right",
    });
    y += 18;

    if (payment) {
        y += 8;
        text(`Paid on ${format(parseISO(payment.paidAt), "d MMM yyyy")} — ${rs(payment.amount)}`, M, y, {
            size: 10,
            bold: true,
            color: [21, 128, 61],
        });
        if (Math.round(payment.amount) !== Math.round(summary.balance)) {
            y += 5.5;
            text(
                `Note: net pay was ${rs(payment.amount)} when paid; attendance or advances changed afterwards.`,
                M,
                y,
                { size: 8.5, color: [161, 98, 7] },
            );
        }
    }

    // Footer
    text("This is a computer-generated payslip and does not require a signature.", W / 2, 284, {
        size: 8,
        color: MUTED,
        align: "center",
    });
    text(`Generated on ${format(new Date(), "d MMM yyyy, h:mm a")}`, W / 2, 289, {
        size: 8,
        color: MUTED,
        align: "center",
    });

    const safeName = emp.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    doc.save(`Payslip-${safeName}-${format(month, "yyyy-MM")}.pdf`);
}

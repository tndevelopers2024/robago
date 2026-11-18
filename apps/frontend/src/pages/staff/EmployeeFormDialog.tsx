// src/pages/staff/EmployeeFormDialog.tsx — add / edit an employee's profile.
import { useState, type FormEvent, type ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { parseAmount } from "@/lib/staff/calc";
import { staffActions, useEmployees } from "@/lib/staff/staffStore";
import { getErrorMessage } from "@/lib/errors";
import type { EmployeeInput, PhoneStatus } from "@/lib/staff/types";

const EMPTY: EmployeeInput = {
    name: "",
    designation: "",
    department: "",
    phoneStatus: "unknown",
    phone: "",
    emergencyName: "",
    emergencyPhone: "",
    dob: "",
    bloodGroup: "",
    joinedOn: "",
    address: "",
    aadhaar: "",
    bankAccount: "",
    ifsc: "",
    upi: "",
    notes: "",
    monthlySalary: 0,
    active: true,
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const selectClass =
    "h-9 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

interface Props {
    open: boolean;
    employeeId: string | null; // null → add new
    onOpenChange: (open: boolean) => void;
    onSaved?: (id: string) => void;
}

export default function EmployeeFormDialog({ open, employeeId, onOpenChange, onSaved }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Remount per employee so the form always starts from that person's saved values. */}
            {open && (
                <FormBody
                    key={employeeId ?? "new"}
                    employeeId={employeeId}
                    onOpenChange={onOpenChange}
                    onSaved={onSaved}
                />
            )}
        </Dialog>
    );
}

function FormBody({
    employeeId,
    onOpenChange,
    onSaved,
}: {
    employeeId: string | null;
    onOpenChange: (o: boolean) => void;
    onSaved?: (id: string) => void;
}) {
    const { data: employees = [] } = useEmployees();
    const existing = employees.find((e) => e.id === employeeId);
    const [form, setForm] = useState<EmployeeInput>(() => {
        if (!existing) return EMPTY;
        const { id: _id, ...rest } = existing;
        void _id;
        return rest;
    });
    const [salaryText, setSalaryText] = useState(existing ? String(existing.monthlySalary || "") : "");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const name = form.name.trim();
        if (!name) return setError("Please enter the employee's name.");
        const salary = parseAmount(salaryText);
        if (salary === undefined || (salary !== null && salary < 0)) return setError("Salary must be a valid amount.");
        const payload: EmployeeInput = {
            ...form,
            name,
            monthlySalary: salary ?? 0,
        };
        setSaving(true);
        setError(null);
        try {
            const saved = existing
                ? await staffActions.updateEmployee(existing.id, payload)
                : await staffActions.addEmployee(payload);
            onSaved?.(saved.id);
            onOpenChange(false);
        } catch (err) {
            setError(getErrorMessage(err, "Couldn't save. Please try again."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
            <form onSubmit={submit}>
                <DialogHeader className="border-b px-5 py-4 text-left">
                    <DialogTitle>{existing ? `Edit ${existing.name}` : "Add employee"}</DialogTitle>
                    <DialogDescription>
                        Only the name is required — fill in the rest whenever you have it.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 px-5 py-5">
                    <Group title="Work">
                        <Field label="Full name *" className="sm:col-span-2">
                            <Input
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
                                autoFocus
                                placeholder="e.g. Abdul Barick"
                            />
                        </Field>
                        <Field label="Designation">
                            <Input
                                value={form.designation}
                                onChange={(e) => set("designation", e.target.value)}
                                placeholder="e.g. Stitching master"
                            />
                        </Field>
                        <Field label="Department">
                            <Input
                                value={form.department}
                                onChange={(e) => set("department", e.target.value)}
                                placeholder="e.g. Cutting"
                            />
                        </Field>
                        <Field label="Monthly salary (₹)">
                            <Input
                                value={salaryText}
                                onChange={(e) => setSalaryText(e.target.value)}
                                inputMode="decimal"
                                placeholder="0"
                            />
                        </Field>
                        <Field label="Joined on">
                            <Input
                                type="date"
                                value={form.joinedOn}
                                onChange={(e) => set("joinedOn", e.target.value)}
                            />
                        </Field>
                    </Group>

                    <Group title="Contact">
                        <Field label="Has a phone?">
                            <select
                                className={selectClass}
                                value={form.phoneStatus}
                                onChange={(e) => set("phoneStatus", e.target.value as PhoneStatus)}
                            >
                                <option value="unknown">Not known</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </Field>
                        <Field label="Phone number">
                            <Input
                                type="tel"
                                inputMode="tel"
                                value={form.phone}
                                onChange={(e) => set("phone", e.target.value)}
                            />
                        </Field>
                        <Field label="Emergency contact name">
                            <Input value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} />
                        </Field>
                        <Field label="Emergency contact phone">
                            <Input
                                type="tel"
                                inputMode="tel"
                                value={form.emergencyPhone}
                                onChange={(e) => set("emergencyPhone", e.target.value)}
                            />
                        </Field>
                        <Field label="Address" className="sm:col-span-2">
                            <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
                        </Field>
                    </Group>

                    <Group title="Personal">
                        <Field label="Date of birth">
                            <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
                        </Field>
                        <Field label="Blood group">
                            <select
                                className={selectClass}
                                value={form.bloodGroup}
                                onChange={(e) => set("bloodGroup", e.target.value as EmployeeInput["bloodGroup"])}
                            >
                                <option value="">—</option>
                                {BLOOD_GROUPS.map((b) => (
                                    <option key={b}>{b}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Aadhaar number" className="sm:col-span-2">
                            <Input
                                inputMode="numeric"
                                value={form.aadhaar}
                                onChange={(e) => set("aadhaar", e.target.value)}
                            />
                        </Field>
                    </Group>

                    <Group title="Bank & payment">
                        <Field label="Bank account no.">
                            <Input
                                inputMode="numeric"
                                value={form.bankAccount}
                                onChange={(e) => set("bankAccount", e.target.value)}
                            />
                        </Field>
                        <Field label="IFSC">
                            <Input value={form.ifsc} onChange={(e) => set("ifsc", e.target.value.toUpperCase())} />
                        </Field>
                        <Field label="UPI ID" className="sm:col-span-2">
                            <Input
                                value={form.upi}
                                onChange={(e) => set("upi", e.target.value)}
                                placeholder="name@bank"
                            />
                        </Field>
                    </Group>

                    <Group title="Other">
                        <Field label="Notes" className="sm:col-span-2">
                            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                        </Field>
                        <label className="flex items-center justify-between rounded-xl border p-3 sm:col-span-2">
                            <span>
                                <span className="block text-sm font-medium">Currently working</span>
                                <span className="block text-xs text-muted-foreground">
                                    Inactive staff are hidden from the sheets by default.
                                </span>
                            </span>
                            <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
                        </label>
                    </Group>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-destructive"
                        >
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter className="sticky bottom-0 gap-2 border-t bg-background px-5 py-3 sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving…" : existing ? "Save changes" : "Add employee"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <fieldset>
            <legend className="mb-3 text-xs font-semibold tracking-[0.12em] text-primary uppercase">{title}</legend>
            <div className="grid gap-3 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
    return (
        <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {children}
        </label>
    );
}

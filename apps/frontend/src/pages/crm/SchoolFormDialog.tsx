// src/pages/crm/SchoolFormDialog.tsx — add a school (optionally together with the visit you just made), or edit its details.
import { useState, type FormEvent } from "react";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";
import type { SchoolBoard, SchoolDTO } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { crmActions, useSchoolDetail, useSchools } from "@/lib/crm/store";
import { BOARDS } from "@/lib/crm/meta";
import { cn } from "@/lib/utils";
import VisitFields, { emptyVisit, Field, toVisitInput, type VisitForm } from "./VisitFields";

interface Props {
    open: boolean;
    /** null = add a new school. */
    schoolId: string | null;
    /** Pre-fill the district (e.g. the one currently selected). */
    defaultDistrict?: string;
    onOpenChange: (o: boolean) => void;
}

export default function SchoolFormDialog({ open, schoolId, defaultDistrict, onOpenChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open && (
                <Body
                    key={schoolId ?? "new"}
                    schoolId={schoolId}
                    defaultDistrict={defaultDistrict ?? ""}
                    onOpenChange={onOpenChange}
                />
            )}
        </Dialog>
    );
}

/** "11.6643, 78.1460" (or with spaces / a semicolon) → numbers, or null if it isn't a usable pair. */
function parsePin(text: string): { lat: number; lng: number } | null {
    const m = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
    if (!m) return null;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    return lat >= 5 && lat <= 16 && lng >= 74 && lng <= 84 ? { lat, lng } : null;
}

interface FormState {
    name: string;
    district: string;
    place: string;
    board: SchoolBoard;
    students: string;
    correspondent: string;
    phone: string;
    reference: string;
    notes: string;
    address: string;
    /** "lat, lng" — optional exact map position. */
    pin: string;
}
const fromSchool = (s: SchoolDTO): FormState => ({
    name: s.name,
    district: s.district,
    place: s.place,
    board: s.board,
    students: s.studentCount === null ? "" : String(s.studentCount),
    correspondent: s.correspondent,
    phone: s.phone,
    reference: s.reference,
    notes: s.notes,
    address: s.address,
    pin: s.lat !== null && s.lng !== null ? `${s.lat}, ${s.lng}` : "",
});

function Body({
    schoolId,
    defaultDistrict,
    onOpenChange,
}: {
    schoolId: string | null;
    defaultDistrict: string;
    onOpenChange: (o: boolean) => void;
}) {
    const detail = useSchoolDetail(schoolId);
    const { data: all = [] } = useSchools(true);
    if (schoolId && !detail.data) return null;
    const districts = [...new Set(all.map((s) => s.district))].sort();
    return (
        <Form
            existing={detail.data?.school ?? null}
            defaultDistrict={defaultDistrict}
            districts={districts}
            onOpenChange={onOpenChange}
        />
    );
}

function Form({
    existing,
    defaultDistrict,
    districts,
    onOpenChange,
}: {
    existing: SchoolDTO | null;
    defaultDistrict: string;
    districts: string[];
    onOpenChange: (o: boolean) => void;
}) {
    const [form, setForm] = useState<FormState>(
        existing
            ? fromSchool(existing)
            : {
                  name: "",
                  district: defaultDistrict,
                  place: "",
                  board: "cbse",
                  students: "",
                  correspondent: "",
                  phone: "",
                  reference: "",
                  notes: "",
                  address: "",
                  pin: "",
              },
    );
    const [visited, setVisited] = useState(false);
    const [visit, setVisit] = useState<VisitForm>(emptyVisit);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        if (!form.name.trim()) next.name = "School name is required";
        if (!form.district.trim()) next.district = "District is required";
        if (!existing && visited && !visit.outcome.trim()) next.outcome = "Write what happened in the meeting";
        const pin = parsePin(form.pin);
        if (form.pin.trim() && !pin) next.pin = "Use two numbers like 11.6643, 78.1460 (inside Tamil Nadu and nearby)";
        if (Object.keys(next).length) return setErrors(next);

        const digits = form.students.replace(/[^\d]/g, "");
        const base = {
            name: form.name.trim(),
            district: form.district.trim(),
            place: form.place.trim(),
            board: form.board,
            studentCount: digits ? Number(digits) : null,
            studentNote: existing && digits === String(existing.studentCount ?? "") ? existing.studentNote : "",
            correspondent: form.correspondent.trim(),
            phone: form.phone.trim(),
            reference: form.reference.trim(),
            notes: form.notes.trim(),
            address: form.address.trim(),
            lat: pin?.lat ?? null,
            lng: pin?.lng ?? null,
        };
        setSaving(true);
        setErrors({});
        setMessage(null);
        try {
            if (existing)
                await crmActions.updateSchool(existing.id, { ...base, expectedUpdatedAt: existing.updatedAt });
            else await crmActions.createSchool({ ...base, ...(visited ? { visit: toVisitInput(visit) } : {}) });
            toast.success(existing ? "School updated" : visited ? "School and visit saved" : "School added");
            onOpenChange(false);
        } catch (err) {
            setErrors(getFieldErrors(err) ?? {});
            setMessage(getErrorMessage(err, "Couldn't save. Please try again."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{existing ? `Edit ${existing.name}` : "Add a school"}</DialogTitle>
                <DialogDescription>
                    {existing
                        ? "Correct the details. Visits are logged separately, from the school's page."
                        : "Add a school you visited, or one you plan to visit."}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <Field label="School name" error={errors.name}>
                            <Input
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
                                placeholder="e.g. Vijay Kids CBSE & Matric"
                                autoFocus={!existing}
                            />
                        </Field>
                    </div>
                    <Field label="District" error={errors.district}>
                        <Input
                            list="crm-districts"
                            value={form.district}
                            onChange={(e) => set("district", e.target.value)}
                            placeholder="e.g. Dharmapuri"
                        />
                        <datalist id="crm-districts">
                            {districts.map((d) => (
                                <option key={d} value={d} />
                            ))}
                        </datalist>
                    </Field>
                    <Field label="Town / area" error={errors.place}>
                        <Input
                            value={form.place}
                            onChange={(e) => set("place", e.target.value)}
                            placeholder="e.g. Harur"
                        />
                    </Field>
                    <Field label="Board">
                        <select
                            value={form.board}
                            onChange={(e) => set("board", e.target.value as SchoolBoard)}
                            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            {BOARDS.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Number of students">
                        <Input
                            inputMode="numeric"
                            value={form.students}
                            onChange={(e) => set("students", e.target.value)}
                            placeholder="e.g. 1500"
                        />
                    </Field>
                    <Field label="Correspondent / contact person">
                        <Input value={form.correspondent} onChange={(e) => set("correspondent", e.target.value)} />
                    </Field>
                    <Field label="Phone number(s)">
                        <Input
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder="Name – number"
                        />
                    </Field>
                    <div className="sm:col-span-2">
                        <Field label="Reference (who introduced us)">
                            <Input value={form.reference} onChange={(e) => set("reference", e.target.value)} />
                        </Field>
                    </div>
                    <div className="sm:col-span-2">
                        <Field
                            label="Address (optional)"
                            hint="With the address, the map button finds the exact school instead of guessing from its name."
                        >
                            <Input
                                value={form.address}
                                onChange={(e) => set("address", e.target.value)}
                                placeholder="Street, area, pincode"
                            />
                        </Field>
                    </div>
                    <div className="sm:col-span-2">
                        <Field
                            label="Exact map position (optional)"
                            error={errors.pin}
                            hint="Without it the school is shown at its town's centre. Paste the numbers from Google Maps, or press the button while you are at the school."
                        >
                            <div className="flex gap-2">
                                <Input
                                    value={form.pin}
                                    onChange={(e) => set("pin", e.target.value)}
                                    placeholder="e.g. 11.6643, 78.1460"
                                    inputMode="decimal"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="shrink-0 gap-1.5"
                                    onClick={() => {
                                        if (!navigator.geolocation)
                                            return toast.error("This device can't share its location.");
                                        navigator.geolocation.getCurrentPosition(
                                            (pos) =>
                                                set(
                                                    "pin",
                                                    `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
                                                ),
                                            () =>
                                                toast.error(
                                                    "Couldn't get your location. Allow location access and try again.",
                                                ),
                                            { enableHighAccuracy: true, timeout: 10000 },
                                        );
                                    }}
                                >
                                    <LocateFixed className="size-4" /> I'm here now
                                </Button>
                            </div>
                        </Field>
                    </div>
                    <div className="sm:col-span-2">
                        <Field label="Notes">
                            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
                        </Field>
                    </div>
                </div>

                {!existing && (
                    <div
                        className={cn(
                            "rounded-2xl border p-4 transition-colors",
                            visited && "border-primary/30 bg-primary/5",
                        )}
                    >
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                            <input
                                type="checkbox"
                                className="size-4 accent-[var(--primary)]"
                                checked={visited}
                                onChange={(e) => setVisited(e.target.checked)}
                            />
                            I have already visited this school — record the meeting now
                        </label>
                        {visited && (
                            <div className="mt-4">
                                <VisitFields value={visit} onChange={setVisit} errors={errors} />
                            </div>
                        )}
                    </div>
                )}

                {message && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                        {message}
                    </p>
                )}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving…" : existing ? "Save changes" : "Add school"}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}

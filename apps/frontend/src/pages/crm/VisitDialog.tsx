// src/pages/crm/VisitDialog.tsx — log a visit to a school: the first thing to do after every meeting.
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { crmActions, useSchools } from "@/lib/crm/store";
import { nearbyProspects } from "@/lib/crm/meta";
import VisitFields, { emptyVisit, toVisitInput, type VisitForm } from "./VisitFields";

export default function VisitDialog({ schoolId, onClose }: { schoolId: string | null; onClose: () => void }) {
    return (
        <Dialog open={Boolean(schoolId)} onOpenChange={(o) => !o && onClose()}>
            {schoolId && <Body key={schoolId} schoolId={schoolId} onClose={onClose} />}
        </Dialog>
    );
}

function Body({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
    const { data: schools = [] } = useSchools();
    const school = schools.find((s) => s.id === schoolId);
    const [form, setForm] = useState<VisitForm>(() => ({ ...emptyVisit(), metWith: "" }));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    if (!school) return null;

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.outcome.trim()) return setErrors({ outcome: "Write what happened in the meeting" });
        setSaving(true);
        setErrors({});
        setMessage(null);
        try {
            await crmActions.logVisit(school.id, toVisitInput(form));
            const more = nearbyProspects(schools, school, 500).length;
            toast.success(`Visit saved for ${school.name}`, {
                description: more
                    ? `${more} more private school${more === 1 ? "" : "s"} to approach in ${school.district}.`
                    : undefined,
            });
            onClose();
        } catch (err) {
            setErrors(getFieldErrors(err) ?? {});
            setMessage(getErrorMessage(err, "Couldn't save the visit. Please try again."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>Log a visit · {school.name}</DialogTitle>
                <DialogDescription>
                    {school.place || school.district}
                    {school.place && school.place !== school.district ? `, ${school.district}` : ""} — write down how
                    the meeting went.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-5">
                <VisitFields value={form} onChange={setForm} errors={errors} />
                {message && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                        {message}
                    </p>
                )}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving…" : "Save visit"}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}

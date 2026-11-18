// src/pages/crm/VisitFields.tsx — the form fields for one visit: when, who, what happened, where it stands now.
import type { LogVisitInput, SchoolStage } from "@robago/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { todayIso } from "@/lib/accounts/format";
import { VISIT_STAGES } from "@/lib/crm/meta";
import { cn } from "@/lib/utils";

export interface VisitForm {
    date: string;
    metWith: string;
    outcome: string;
    stage: SchoolStage;
    nextFollowUp: string;
}
export const emptyVisit = (): VisitForm => ({
    date: todayIso(),
    metWith: "",
    outcome: "",
    stage: "visited",
    nextFollowUp: "",
});
export const toVisitInput = (f: VisitForm): LogVisitInput => ({
    date: f.date,
    metWith: f.metWith.trim(),
    outcome: f.outcome.trim(),
    stage: f.stage as LogVisitInput["stage"],
    nextFollowUp: f.nextFollowUp,
});

export function Field({
    label,
    error,
    hint,
    children,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="text-sm font-medium">{label}</span>
            {children}
            {hint && !error && <span className="block text-xs text-muted-foreground">{hint}</span>}
            {error && <span className="block text-xs font-medium text-destructive">{error}</span>}
        </label>
    );
}

export default function VisitFields({
    value,
    onChange,
    errors = {},
}: {
    value: VisitForm;
    onChange: (v: VisitForm) => void;
    errors?: Record<string, string>;
}) {
    const set = <K extends keyof VisitForm>(k: K, v: VisitForm[K]) => onChange({ ...value, [k]: v });
    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Date of visit" error={errors.date}>
                    <Input
                        type="date"
                        value={value.date}
                        max={todayIso()}
                        onChange={(e) => set("date", e.target.value)}
                    />
                </Field>
                <Field label="Whom did you meet?" error={errors.metWith}>
                    <Input
                        value={value.metWith}
                        onChange={(e) => set("metWith", e.target.value)}
                        placeholder="e.g. Principal, MD, AO"
                    />
                </Field>
            </div>

            <Field label="What happened in the meeting?" error={errors.outcome}>
                <Textarea
                    value={value.outcome}
                    onChange={(e) => set("outcome", e.target.value)}
                    placeholder="Sample shown, quotation sent, what they said, what to do next…"
                    rows={3}
                    autoFocus
                />
            </Field>

            <div className="space-y-1.5">
                <span className="text-sm font-medium">Where does it stand now?</span>
                <div role="radiogroup" aria-label="Where does it stand now" className="grid gap-2 sm:grid-cols-2">
                    {VISIT_STAGES.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            role="radio"
                            aria-checked={value.stage === s.id}
                            onClick={() => set("stage", s.id)}
                            className={cn(
                                "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors",
                                value.stage === s.id
                                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                    : "hover:bg-muted/60",
                            )}
                        >
                            <span className={cn("size-2.5 shrink-0 rounded-full", s.dot)} />
                            <span className="min-w-0">
                                <span className="block text-sm leading-tight font-medium">{s.label}</span>
                                <span className="block truncate text-xs text-muted-foreground">{s.hint}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <Field
                label="Follow up on (optional)"
                error={errors.nextFollowUp}
                hint="You'll see it as “follow-up due” on that day."
            >
                <Input
                    type="date"
                    value={value.nextFollowUp}
                    min={value.date}
                    onChange={(e) => set("nextFollowUp", e.target.value)}
                />
            </Field>
        </div>
    );
}

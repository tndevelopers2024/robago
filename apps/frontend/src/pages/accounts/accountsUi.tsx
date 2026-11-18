// Small shared pieces for the Accounts pages.
import type { ActorDTO, AccountKind } from "@robago/shared";
import { exactTime } from "@/lib/accounts/format";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "@/pages/staff/staffUi";

/** Blue = money coming in (debtors), orange = money going out (creditors) — the same on every Accounts chart. */
export const KIND_COLOR: Record<AccountKind, string> = {
    creditor: "var(--viz-operational)",
    debtor: "var(--viz-general)",
};
export const KIND_LABEL: Record<AccountKind, { title: string; short: string; verb: string }> = {
    creditor: { title: "Creditors", short: "To pay", verb: "Pay" },
    debtor: { title: "Debtors", short: "To collect", verb: "Receive" },
};

/** "Hijaz" with a small avatar; the phone number is on hover. */
export function ActorChip({ actor, className, at }: { actor: ActorDTO; className?: string; at?: string }) {
    return (
        <span
            className={cn("inline-flex items-center gap-1.5 align-middle", className)}
            title={`${actor.name}${actor.phone ? ` · ${actor.phone}` : ""}${at ? ` · ${exactTime(at)}` : ""}`}
        >
            <EmployeeAvatar name={actor.name || "?"} className="size-5 text-[9px]" />
            <span className="font-medium">{actor.name || "Unknown"}</span>
        </span>
    );
}

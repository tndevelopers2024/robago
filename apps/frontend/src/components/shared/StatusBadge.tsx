// src/components/shared/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@robago/shared";

// Purchase/Production increase stock (green), Sale/Consumption decrease it (red),
// Adjustment is a manual correction (blue) — matches robago-prd.md §4.3's UI convention.
const TRANSACTION_TYPE_STYLES: Record<TransactionType, string> = {
    Purchase: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
    Production: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
    Consumption: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
    Sale: "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-100",
    Adjustment: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100",
};

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
    return <Badge className={cn("font-medium", TRANSACTION_TYPE_STYLES[type])}>{type}</Badge>;
}

export default TransactionTypeBadge;

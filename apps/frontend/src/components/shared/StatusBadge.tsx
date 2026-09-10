// src/components/shared/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@robago/shared";

// Purchase/Production increase stock (green), Sale/Consumption decrease it (red),
// Adjustment is a manual correction (blue) — matches robago-prd.md §4.3's UI convention.
const TRANSACTION_TYPE_STYLES: Record<TransactionType, string> = {
    Purchase: "bg-green-100 text-green-800 hover:bg-green-100",
    Production: "bg-green-100 text-green-800 hover:bg-green-100",
    Sale: "bg-red-100 text-red-800 hover:bg-red-100",
    Consumption: "bg-red-100 text-red-800 hover:bg-red-100",
    Adjustment: "bg-blue-100 text-blue-800 hover:bg-blue-100",
};

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
    return <Badge className={cn("font-medium", TRANSACTION_TYPE_STYLES[type])}>{type}</Badge>;
}

export default TransactionTypeBadge;

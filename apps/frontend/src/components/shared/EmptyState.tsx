// src/components/shared/EmptyState.tsx
import { Inbox } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
            <Inbox className="size-8 text-slate-300" />
            <p className="text-sm text-slate-500">{message}</p>
        </div>
    );
}

export default EmptyState;

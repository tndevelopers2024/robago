import { useState } from "react";
import { FlaskConical, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { isDemoForced, isDemoModeActive } from "@/lib/mockAdapter";
import { leaveDemoIfServerIsUp } from "@/lib/backendProbe";

/** Shown whenever the app is NOT talking to the real server, so nobody mistakes
 *  browser-only demo data for saved company data. */
export default function DemoBanner() {
    const [busy, setBusy] = useState(false);
    if (!isDemoModeActive()) return null;

    const reconnect = async () => {
        setBusy(true);
        const ok = await leaveDemoIfServerIsUp();
        setBusy(false);
        if (ok) window.location.reload();
        else toast.error("Still can't reach the server. Is the backend running?");
    };

    return (
        <div className="flex shrink-0 items-center justify-center gap-2 bg-warning-soft px-3 py-1.5 text-center text-xs font-medium text-warning">
            <FlaskConical className="size-3.5 shrink-0" />
            <span>Demo mode — changes are saved only in this browser, not on the server.</span>
            {!isDemoForced() && (
                <button
                    onClick={reconnect}
                    disabled={busy}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-card px-2 py-0.5 font-semibold text-foreground shadow-xs disabled:opacity-60"
                >
                    <RefreshCw className={busy ? "size-3 animate-spin" : "size-3"} /> Reconnect
                </button>
            )}
        </div>
    );
}

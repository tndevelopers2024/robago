import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { roleLabel } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";

/** Shown instead of a page the person's role doesn't include. */
export default function AccessDenied() {
    const { user } = useAuth();
    return (
        <div className="grid min-h-[60dvh] place-items-center p-6">
            <div className="max-w-md text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-warning-soft text-warning">
                    <LockKeyhole className="size-8" />
                </span>
                <h1 className="mt-5 text-2xl font-semibold">This area isn't part of your role</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    You're signed in as <b className="text-foreground">{roleLabel(user?.role)}</b>, and this section is
                    only for super admins. If you need access, ask one of them to change your role.
                </p>
                <Button asChild className="mt-6">
                    <Link to="/">Back to the dashboard</Link>
                </Button>
            </div>
        </div>
    );
}

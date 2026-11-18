// src/components/shared/ConfirmDeleteDialog.tsx
import { useState, type ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Permission } from "@robago/shared";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";

interface ConfirmDeleteDialogProps {
    trigger: ReactNode;
    title: string;
    description?: string;
    onConfirm: () => Promise<unknown>;
    /** Who may delete — the button is simply not shown to anyone else. Defaults to deleting catalogue items. */
    permission?: Permission;
}

/** The backend surfaces robago-prd.md §8's exact dependency-block messages (e.g. "Can't
 *  delete. Dependent data exists.") as a 409 — the calling mutation's onError already
 *  toasts that string (see hooks/queries/*), so this dialog just closes on any outcome
 *  and lets the toast communicate success/failure. */
export function ConfirmDeleteDialog({
    trigger,
    title,
    description = "This action cannot be undone.",
    onConfirm,
    permission = Permission.CatalogDelete,
}: ConfirmDeleteDialogProps) {
    const { can } = useAuth();
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!can(permission)) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={async () => {
                            setIsDeleting(true);
                            try {
                                await onConfirm();
                                setOpen(false);
                            } finally {
                                setIsDeleting(false);
                            }
                        }}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmDeleteDialog;

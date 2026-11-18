// src/pages/staff/EmployeeDrawer.tsx — slide-out version of the profile (phones, tablets, salary sheet).
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { monthKey, useStaff } from "@/lib/staff/staffStore";
import EmployeeProfile from "./EmployeeProfile";

interface Props {
    employeeId: string | null;
    month: Date;
    onClose: () => void;
    onEdit: (id: string) => void;
}

export default function EmployeeDrawer({ employeeId, month, onClose, onEdit }: Props) {
    const { employees, advances, attendance, payments } = useStaff(month);
    const emp = employees.find((e) => e.id === employeeId) ?? null;

    return (
        <Sheet open={Boolean(emp)} onOpenChange={(o) => !o && onClose()}>
            <SheetContent
                side="right"
                className="w-full gap-0 overflow-y-auto bg-background p-0 sm:max-w-xl [&>button]:z-10 [&>button]:text-white [&>button]:opacity-80"
            >
                <SheetDescription className="sr-only">Pay, attendance and personal details</SheetDescription>
                {emp && (
                    <EmployeeProfile
                        emp={emp}
                        month={month}
                        advances={advances}
                        attendance={attendance}
                        payment={payments[`${emp.id}|${monthKey(month)}`]}
                        variant="drawer"
                        onEdit={() => onEdit(emp.id)}
                        onClose={onClose}
                        title={(name) => (
                            <SheetTitle className="font-heading truncate pr-8 text-2xl font-semibold text-white">
                                {name}
                            </SheetTitle>
                        )}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}

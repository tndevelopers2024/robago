import SalarySheet from "./SalarySheet";
import { useStaffContext } from "./staffContext";

export default function SalaryPage() {
    const { employees, advances, attendance, payments, month, openEmployee } = useStaffContext();
    return (
        <SalarySheet
            employees={employees}
            advances={advances}
            attendance={attendance}
            payments={payments}
            month={month}
            onOpen={openEmployee}
        />
    );
}

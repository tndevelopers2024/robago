import AttendanceSheet from "./AttendanceSheet";
import { useStaffContext } from "./staffContext";

export default function AttendancePage() {
    const { employees, attendance, month } = useStaffContext();
    return <AttendanceSheet employees={employees} attendance={attendance} month={month} />;
}

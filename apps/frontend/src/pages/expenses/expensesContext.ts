import { useOutletContext } from "react-router-dom";

export interface ExpensesOutletContext {
    month: Date;
    setMonth: (d: Date) => void;
    openAdd: () => void;
}
export const useExpensesContext = () => useOutletContext<ExpensesOutletContext>();

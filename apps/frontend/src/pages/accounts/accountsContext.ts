import { useOutletContext } from "react-router-dom";
import type { AccountKind, EntryType } from "@robago/shared";

export interface AccountsOutletContext {
    openAccount: (id: string) => void;
    openEntry: (accountId: string, type?: EntryType) => void;
    openReminder: (accountId: string) => void;
    /** Add a new account of this kind. */
    addAccount: (kind: AccountKind) => void;
}
export const useAccountsContext = () => useOutletContext<AccountsOutletContext>();

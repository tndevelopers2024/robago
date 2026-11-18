import type { CreateExpenseInput } from "@robago/shared";

/** What each entry mode calls to save; resolves true when saved (so the mode can reset itself). */
export type SaveFn = (entries: CreateExpenseInput[], label: string) => Promise<boolean>;

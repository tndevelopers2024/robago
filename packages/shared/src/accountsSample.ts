// src/accountsSample.ts
// The client's creditors and debtors, copied from their sheet ("Creditors" ₹73,82,774.50 and
// "Debtors" ₹1,05,02,310.55 → net ₹31,19,536.05). Used by `seed:accounts` and the offline demo.
// Contact details are blank on purpose — they are added from the app.

export interface AccountSampleRow {
    name: string;
    /** What is owed today (becomes the opening ledger entry). */
    balance: number;
    dueDate?: string;
}

export const CREDITORS_SAMPLE: AccountSampleRow[] = [
    { name: "NSE", balance: 265000 },
    { name: "Ismail Machan", balance: 350000 },
    { name: "AKB - LKS", balance: 2350000, dueDate: "2026-09-17" },
    { name: "Amina", balance: 988000 },
    { name: "BDM-Commission", balance: 30000 },
    { name: "KAS", balance: 375594 },
    { name: "Janakson-YKK", balance: 189426 },
    { name: "S A Impex — Fixed Expenses", balance: 756200 },
    { name: "Divine", balance: 259524 },
    { name: "Printone", balance: 208644 },
    { name: "AK", balance: 100000 },
    { name: "Printing", balance: 390000 },
    { name: "Surya", balance: 40000 },
    { name: "Seyon printers", balance: 20000 },
    { name: "Growth enterprises", balance: 71033 },
    { name: "Chandra Rexine", balance: 833361.5 },
    { name: "Impex India", balance: 35800 },
    { name: "Mahaveer Trade", balance: 91350 },
    { name: "Anandha Store", balance: 3310 },
    { name: "Rajmurugan Veg Store", balance: 25532 },
];

export const DEBTORS_SAMPLE: AccountSampleRow[] = [
    { name: "Warehouse advance", balance: 150000 },
    { name: "School building — Ghani", balance: 285000 },
    { name: "Staff advance", balance: 167160 },
    { name: "Outstanding balance (SA)", balance: 2196000 },
    { name: "Robago", balance: 1113000 },
    { name: "Rubber", balance: 78407 },
    { name: "Airmesh", balance: 118537.5 },
    { name: "Tape", balance: 488460 },
    { name: "China new fittings", balance: 183280 },
    { name: "New China stock", balance: 1173101 },
    { name: "Retail backpack stock and online", balance: 1179679 },
    { name: "GRT — stock", balance: 434260 },
    { name: "Future TVS — stock", balance: 140000 },
    { name: "Thangamayil", balance: 82600 },
    { name: "Gajanadha Jewellers", balance: 91792 },
    { name: "Fittings", balance: 171034.05 },
    { name: "Machines", balance: 300000 },
    { name: "Export stock (approx.)", balance: 1100000 },
    { name: "Indium", balance: 750000 },
    { name: "Raptee", balance: 300000 },
];

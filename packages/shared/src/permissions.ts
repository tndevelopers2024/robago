// src/permissions.ts
//
// Role-based access control, in one place. A ROLE is just a named list of PERMISSIONS, and both the
// server (every protected route) and the screens (menus, buttons, pages) ask "can this role do X?"
// through the same `can()` — so what a role may do is changed here and nowhere else.
import { UserRole } from "./enums.js";

export const Permission = {
    // --- inventory side ---
    InventoryView: "inventory.view", // stock list, item pages, low-stock alerts, dashboard stock widgets
    InventoryManage: "inventory.manage", // create / edit stock items and their photos
    TransactionsRecord: "transactions.record", // record purchases, production, sales, consumption, adjustments
    TransactionsEdit: "transactions.edit", // change a stock movement after it was recorded
    CatalogManage: "catalog.manage", // add / edit products, categories, warehouses, suppliers, production units
    CatalogDelete: "catalog.delete", // delete any of the above
    // --- money & people side ---
    StaffManage: "staff.manage", // employees, attendance, salaries, advances, payslips
    ExpensesManage: "expenses.manage",
    AccountsManage: "accounts.manage", // creditors, debtors, payments, reminders, activity log
    CrmManage: "crm.manage", // school visits, follow-ups and the schools directory
    UsersManage: "users.manage", // who can log in, and as what
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

const ALL = Object.values(Permission);

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
    [UserRole.SuperAdmin]: ALL,
    [UserRole.Manager]: [
        Permission.InventoryView,
        Permission.InventoryManage,
        Permission.TransactionsRecord,
        Permission.CatalogManage,
    ],
};

/** Can this role do this? An unknown or missing role can do nothing. */
export function can(role: string | undefined | null, permission: Permission): boolean {
    const list = ROLE_PERMISSIONS[role as UserRole];
    return Boolean(list?.includes(permission));
}

export const ROLE_LABEL: Record<UserRole, string> = {
    [UserRole.SuperAdmin]: "Super admin",
    [UserRole.Manager]: "Manager",
};

export const ROLE_DESCRIPTION: Record<UserRole, string> = {
    [UserRole.SuperAdmin]: "Everything: staff & salaries, expenses, accounts, school visits, users and all of inventory.",
    [UserRole.Manager]: "Inventory only: stock, transactions and the product catalogue. No staff, money or user access.",
};

export function roleLabel(role: string | undefined | null): string {
    return ROLE_LABEL[role as UserRole] ?? "No access";
}

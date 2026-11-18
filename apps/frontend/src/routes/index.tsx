// src/routes/index.tsx
/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import RootLayout from "@/layouts/RootLayout";
import ProtectedRoute from "./ProtectedRoutes";
import PermissionRoute from "./PermissionRoute";
import { Permission } from "@robago/shared";
import { Skeleton } from "@/components/ui/skeleton";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ExpensesLayout = lazy(() => import("@/pages/expenses/ExpensesLayout"));
const ExpensesOverviewPage = lazy(() => import("@/pages/expenses/OverviewPage"));
const ExpensesEntriesPage = lazy(() => import("@/pages/expenses/EntriesPage"));
const ExpensesMonthlyPage = lazy(() => import("@/pages/expenses/MonthlyPage"));
const ExpensesItemsPage = lazy(() => import("@/pages/expenses/ItemsPage"));
const SchoolsPage = lazy(() => import("@/pages/crm/SchoolsPage"));
const AccountsLayout = lazy(() => import("@/pages/accounts/AccountsLayout"));
const AccountsOverviewPage = lazy(() => import("@/pages/accounts/OverviewPage"));
const CreditorsPage = lazy(() => import("@/pages/accounts/CreditorsPage"));
const DebtorsPage = lazy(() => import("@/pages/accounts/DebtorsPage"));
const ActivityPage = lazy(() => import("@/pages/accounts/ActivityPage"));
const StaffLayout = lazy(() => import("@/pages/staff/StaffLayout"));
const SalaryPage = lazy(() => import("@/pages/staff/SalaryPage"));
const AttendancePage = lazy(() => import("@/pages/staff/AttendancePage"));
const PeoplePage = lazy(() => import("@/pages/staff/PeoplePage"));
const InventoryListPage = lazy(() => import("@/pages/inventory/InventoryListPage"));
const InventoryAlertsPage = lazy(() => import("@/pages/inventory/InventoryAlertsPage"));
const InventoryDetailPage = lazy(() => import("@/pages/inventory/InventoryDetailPage"));
const ManageLayout = lazy(() => import("@/pages/manage/ManageLayout"));
const CategoriesPage = lazy(() => import("@/pages/manage/CategoriesPage"));
const ProductsPage = lazy(() => import("@/pages/manage/ProductsPage"));
const WarehousesPage = lazy(() => import("@/pages/manage/WarehousesPage"));
const SuppliersPage = lazy(() => import("@/pages/manage/SuppliersPage"));
const ProductionUnitsPage = lazy(() => import("@/pages/manage/ProductionUnitsPage"));
const UsersPage = lazy(() => import("@/pages/manage/UsersPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));

const PageFallback = () => (
    <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
);

function withSuspense(Component: React.LazyExoticComponent<() => React.JSX.Element>) {
    return (
        <Suspense fallback={<PageFallback />}>
            <Component />
        </Suspense>
    );
}

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                element: <AuthLayout />,
                children: [{ path: "/auth/login", element: withSuspense(LoginPage) }],
            },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "/",
                        element: <AppLayout />,
                        children: [
                            { index: true, element: withSuspense(DashboardPage) },
                            {
                                element: <PermissionRoute permission={Permission.StaffManage} />,
                                children: [
                                {
                                    path: "staff",
                                    element: withSuspense(StaffLayout),
                                    children: [
                                        { index: true, element: <Navigate to="salary" replace /> },
                                        { path: "salary", element: withSuspense(SalaryPage) },
                                        { path: "attendance", element: withSuspense(AttendancePage) },
                                        { path: "people", element: withSuspense(PeoplePage) },
                                    ],
                                },
                                ],
                            },
                            {
                                element: <PermissionRoute permission={Permission.ExpensesManage} />,
                                children: [
                                {
                                    path: "expenses",
                                    element: withSuspense(ExpensesLayout),
                                    children: [
                                        { index: true, element: <Navigate to="overview" replace /> },
                                        { path: "overview", element: withSuspense(ExpensesOverviewPage) },
                                        { path: "entries", element: withSuspense(ExpensesEntriesPage) },
                                        { path: "monthly", element: withSuspense(ExpensesMonthlyPage) },
                                        { path: "items", element: withSuspense(ExpensesItemsPage) },
                                    ],
                                },
                                ],
                            },
                            {
                                element: <PermissionRoute permission={Permission.AccountsManage} />,
                                children: [
                                {
                                    path: "accounts",
                                    element: withSuspense(AccountsLayout),
                                    children: [
                                        { index: true, element: <Navigate to="overview" replace /> },
                                        { path: "overview", element: withSuspense(AccountsOverviewPage) },
                                        { path: "creditors", element: withSuspense(CreditorsPage) },
                                        { path: "debtors", element: withSuspense(DebtorsPage) },
                                        { path: "activity", element: withSuspense(ActivityPage) },
                                    ],
                                },
                                ],
                            },
                            {
                                element: <PermissionRoute permission={Permission.CrmManage} />,
                                children: [
                                    { path: "crm", element: <Navigate to="schools" replace /> },
                                    { path: "crm/schools", element: withSuspense(SchoolsPage) },
                                ],
                            },
                            {
                                element: <PermissionRoute permission={Permission.InventoryView} />,
                                children: [
                                    { path: "inventory", element: withSuspense(InventoryListPage) },
                                    { path: "inventory/alerts", element: withSuspense(InventoryAlertsPage) },
                                    { path: "inventory/:id", element: withSuspense(InventoryDetailPage) },
                                ],
                            },
                            {
                                path: "manage",
                                element: withSuspense(ManageLayout),
                                children: [
                                    {
                                        element: <PermissionRoute permission={Permission.CatalogManage} />,
                                        children: [
                                            { path: "categories", element: withSuspense(CategoriesPage) },
                                            { path: "products", element: withSuspense(ProductsPage) },
                                            { path: "warehouses", element: withSuspense(WarehousesPage) },
                                            { path: "suppliers", element: withSuspense(SuppliersPage) },
                                            {
                                                path: "production-units",
                                                element: withSuspense(ProductionUnitsPage),
                                            },
                                            {
                                                element: <PermissionRoute permission={Permission.UsersManage} />,
                                                children: [{ path: "users", element: withSuspense(UsersPage) }],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            { path: "*", element: withSuspense(NotFoundPage) },
        ],
    },
]);

export default router;

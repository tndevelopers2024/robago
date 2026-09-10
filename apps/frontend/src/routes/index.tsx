// src/routes/index.tsx
/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import RootLayout from "@/layouts/RootLayout";
import ProtectedRoute from "./ProtectedRoutes";
import AdminRoute from "./AdminRoute";
import { Skeleton } from "@/components/ui/skeleton";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
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
                            { path: "inventory", element: withSuspense(InventoryListPage) },
                            { path: "inventory/alerts", element: withSuspense(InventoryAlertsPage) },
                            { path: "inventory/:id", element: withSuspense(InventoryDetailPage) },
                            {
                                path: "manage",
                                element: withSuspense(ManageLayout),
                                children: [
                                    {
                                        element: <AdminRoute />,
                                        children: [
                                            { path: "categories", element: withSuspense(CategoriesPage) },
                                            { path: "products", element: withSuspense(ProductsPage) },
                                            { path: "warehouses", element: withSuspense(WarehousesPage) },
                                            { path: "suppliers", element: withSuspense(SuppliersPage) },
                                            {
                                                path: "production-units",
                                                element: withSuspense(ProductionUnitsPage),
                                            },
                                            { path: "users", element: withSuspense(UsersPage) },
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

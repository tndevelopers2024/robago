import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute } from "./ProtectedRoute";

import { LoginPage } from "@/pages/auth/Login";
import { DashboardPage } from "@/pages/dashboard/Dashboard";
import { InventoryExplorerPage } from "@/pages/inventory/InventoryExplorer";
import { InventoryDetailPage } from "@/pages/inventory/InventoryDetail";
import { InventoryAlertsPage } from "@/pages/inventory/InventoryAlerts";
import { ManageHubPage } from "@/pages/manage/ManageHub";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/auth",
        element: <AuthLayout />,
        children: [
          {
            path: "login",
            element: <LoginPage />,
          },
          {
            path: "",
            element: <Navigate to="/auth/login" replace />,
          },
        ],
      },
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "inventory",
            children: [
              {
                index: true,
                element: <InventoryExplorerPage />,
              },
              {
                path: "alerts",
                element: <InventoryAlertsPage />,
              },
              {
                path: ":id",
                element: <InventoryDetailPage />,
              },
            ],
          },
          {
            path: "manage",
            element: (
              <ProtectedRoute requireAdmin={true}>
                <ManageHubPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

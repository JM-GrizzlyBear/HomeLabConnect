import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { GuestOnly } from "./auth/GuestOnly";
import { RequireAuth } from "./auth/RequireAuth";
import { RequirePermission } from "./auth/RequirePermission";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { CreateStaffPage } from "./pages/CreateStaffPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HolidaysPage } from "./pages/HolidaysPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProcedureEditorPage } from "./pages/ProcedureEditorPage";
import { ProceduresPage } from "./pages/ProceduresPage";
import { PromotionEditorPage } from "./pages/PromotionEditorPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { RoleEditorPage } from "./pages/RoleEditorPage";
import { RolesPage } from "./pages/RolesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";

export const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  {
    path: "/login",
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: "/register",
    element: (
      <GuestOnly>
        <RegisterPage />
      </GuestOnly>
    ),
  },
  {
    path: "/change-password",
    element: (
      <RequireAuth allowPendingPasswordChange>
        <ChangePasswordPage />
      </RequireAuth>
    ),
  },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "profile", element: <ProfilePage /> },
      {
        path: "users/all",
        element: (
          <RequirePermission permission="users.view">
            <UsersPage />
          </RequirePermission>
        ),
      },
      {
        path: "users/roles",
        element: (
          <RequirePermission permission="roles.view">
            <RolesPage />
          </RequirePermission>
        ),
      },
      {
        path: "users/roles/new",
        element: (
          <RequirePermission permission="roles.manage">
            <RoleEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: "users/roles/:id",
        element: (
          <RequirePermission permission="roles.manage">
            <RoleEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: "users/new",
        element: (
          <RequirePermission permission="users.create">
            <CreateStaffPage />
          </RequirePermission>
        ),
      },
      {
        path: "catalog/procedures",
        element: (
          <RequirePermission permission="procedures.view">
            <ProceduresPage />
          </RequirePermission>
        ),
      },
      {
        path: "catalog/procedures/new",
        element: (
          <RequirePermission permission="procedures.manage">
            <ProcedureEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: "catalog/procedures/:id",
        element: (
          <RequirePermission permission="procedures.manage">
            <ProcedureEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: "catalog/promotions",
        element: (
          <RequirePermission permission="promotions.view">
            <PromotionsPage />
          </RequirePermission>
        ),
      },
      {
        path: "catalog/promotions/new",
        element: (
          <RequirePermission permission="promotions.manage">
            <PromotionEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: "catalog/promotions/:id",
        element: (
          <RequirePermission permission="promotions.manage">
            <PromotionEditorPage />
          </RequirePermission>
        ),
      },
      {
        path: "settings",
        element: (
          <RequirePermission permission="settings.view">
            <SettingsPage />
          </RequirePermission>
        ),
      },
      {
        path: "scheduling/holidays",
        element: (
          <RequirePermission permission="holidays.view">
            <HolidaysPage />
          </RequirePermission>
        ),
      },
      { path: "*", element: <ComingSoonPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];

export const router = createBrowserRouter(routes);

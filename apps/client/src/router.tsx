import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { GuestOnly } from "./auth/GuestOnly";
import { RequireAuth } from "./auth/RequireAuth";
import { RequirePermission } from "./auth/RequirePermission";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { CreateStaffPage } from "./pages/CreateStaffPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProcedureEditorPage } from "./pages/ProcedureEditorPage";
import { ProceduresPage } from "./pages/ProceduresPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { RoleEditorPage } from "./pages/RoleEditorPage";
import { RolesPage } from "./pages/RolesPage";
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
      { path: "*", element: <ComingSoonPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];

export const router = createBrowserRouter(routes);

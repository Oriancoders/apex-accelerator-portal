/**
 * Centralized route configuration.
 * Single source of truth for all app routes — keeps App.tsx clean.
 */
import { lazy } from "react";
import { Navigate } from "react-router-dom";
import RoleAccessGuard from "@/components/RoleAccessGuard";

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const SandboxCallback = lazy(() => import("@/components/sandbox/SandboxCallback"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const TicketsPage = lazy(() => import("@/pages/TicketsPage"));
const NewTicketPage = lazy(() => import("@/pages/NewTicketPage"));
const TicketDetailPage = lazy(() => import("@/pages/TicketDetailPage"));
const CreditsPage = lazy(() => import("@/pages/CreditsPage"));
const PricingGuidePage = lazy(() => import("@/pages/PricingGuidePage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const AboutContactPage = lazy(() => import("@/pages/AboutContactPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const CompanyMembersPage = lazy(() => import("@/pages/CompanyMembersPage"));
const AgentDashboardPage = lazy(() => import("@/pages/AgentDashboardPage"));
const CompanySettingsPage = lazy(() => import("@/pages/CompanySettingsPage"));
const CompanyDashboardPage = lazy(() => import("@/pages/CompanyDashboardPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminTicketsPage = lazy(() => import("@/pages/admin/AdminTicketsPage"));
const AdminTicketDetailPage = lazy(() => import("@/pages/admin/AdminTicketDetailPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminCreditsPage = lazy(() => import("@/pages/admin/AdminCreditsPage"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/AdminNotificationsPage"));
const AdminContactSubmissionsPage = lazy(() => import("@/pages/admin/AdminContactSubmissionsPage"));
const AdminAgentsPage = lazy(() => import("@/pages/admin/AdminAgentsPage"));
const AdminCompanyComponentsPage = lazy(() => import("@/pages/admin/AdminCompanyComponentsPage"));
const AdminCompanyMembersPage = lazy(() => import("@/pages/admin/AdminCompanyMembersPage"));

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
}

export const publicRoutes: RouteConfig[] = [
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/auth", element: <AuthPage /> },
  { path: "/oauth/callback", element: <SandboxCallback /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
];

export const appRoutes: RouteConfig[] = [
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/tickets", element: <TicketsPage /> },
  { path: "/tickets/new", element: <NewTicketPage /> },
  { path: "/tickets/:id", element: <TicketDetailPage /> },
  {
    path: "/:slug/tickets",
    element: (
      <RoleAccessGuard policy="company_dashboard">
        <TicketsPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/:slug/tickets/new",
    element: (
      <RoleAccessGuard policy="company_dashboard">
        <NewTicketPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/:slug/tickets/:id",
    element: (
      <RoleAccessGuard policy="company_dashboard">
        <TicketDetailPage />
      </RoleAccessGuard>
    ),
  },
  { path: "/credits", element: <CreditsPage /> },
  { path: "/pricing", element: <PricingGuidePage /> },
  { path: "/notifications", element: <NotificationsPage /> },
  { path: "/about", element: <AboutContactPage /> },
  { path: "/profile", element: <ProfilePage /> },
  {
    path: "/company/members",
    element: (
      <RoleAccessGuard policy="company_manage">
        <CompanyMembersPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/agent/dashboard",
    element: (
      <RoleAccessGuard policy="agent">
        <AgentDashboardPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/:slug/dashboard",
    element: (
      <RoleAccessGuard policy="company_dashboard">
        <CompanyDashboardPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/:slug/settings",
    element: (
      <RoleAccessGuard policy="company_manage">
        <CompanySettingsPage />
      </RoleAccessGuard>
    ),
  },
];

export const adminRoutes: RouteConfig[] = [
  {
    path: "/admin",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminDashboardPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/admin/tickets",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminTicketsPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/admin/tickets/:id",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminTicketDetailPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/admin/notifications",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminNotificationsPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminUsersPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/admin/agents",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminAgentsPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/admin/company-members",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminCompanyMembersPage />
      </RoleAccessGuard>
    ),
  },

  {
    path: "/admin/credits",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminCreditsPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/admin/company-components",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminCompanyComponentsPage />
      </RoleAccessGuard>
    ),
  },
  {
    path: "/admin/contacts",
    element: (
      <RoleAccessGuard policy="admin">
        <AdminContactSubmissionsPage />
      </RoleAccessGuard>
    ),
  },
];

export const fallbackRoute: RouteConfig = {
  path: "*",
  element: <NotFound />,
};

export const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...appRoutes,
  ...adminRoutes,
  fallbackRoute,
];

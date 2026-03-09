/**
 * Centralized route configuration.
 * Single source of truth for all app routes — keeps App.tsx clean.
 */
import { lazy } from "react";
import { Navigate } from "react-router-dom";

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const TicketsPage = lazy(() => import("@/pages/TicketsPage"));
const NewTicketPage = lazy(() => import("@/pages/NewTicketPage"));
const TicketDetailPage = lazy(() => import("@/pages/TicketDetailPage"));
const CreditsPage = lazy(() => import("@/pages/CreditsPage"));
const PricingGuidePage = lazy(() => import("@/pages/PricingGuidePage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const KnowledgeBasePage = lazy(() => import("@/pages/KnowledgeBasePage"));
const RecipesPage = lazy(() => import("@/pages/RecipesPage"));
const AppExchangePage = lazy(() => import("@/pages/AppExchangePage"));
const NewsPage = lazy(() => import("@/pages/NewsPage"));
const ExtensionsPage = lazy(() => import("@/pages/ExtensionsPage"));
const WhyChooseUsPage = lazy(() => import("@/pages/WhyChooseUsPage"));
const AboutContactPage = lazy(() => import("@/pages/AboutContactPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminTicketsPage = lazy(() => import("@/pages/admin/AdminTicketsPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminArticlesPage = lazy(() => import("@/pages/admin/AdminArticlesPage"));
const AdminCreditsPage = lazy(() => import("@/pages/admin/AdminCreditsPage"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/AdminNotificationsPage"));
const AdminRecipesPage = lazy(() => import("@/pages/admin/AdminRecipesPage"));
const AdminNewsPage = lazy(() => import("@/pages/admin/AdminNewsPage"));
const AdminAppExchangePage = lazy(() => import("@/pages/admin/AdminAppExchangePage"));
const AdminExtensionsPage = lazy(() => import("@/pages/admin/AdminExtensionsPage"));
const AdminContactSubmissionsPage = lazy(() => import("@/pages/admin/AdminContactSubmissionsPage"));

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
}

export const publicRoutes: RouteConfig[] = [
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/auth", element: <AuthPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
];

export const appRoutes: RouteConfig[] = [
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/tickets", element: <TicketsPage /> },
  { path: "/tickets/new", element: <NewTicketPage /> },
  { path: "/tickets/:id", element: <TicketDetailPage /> },
  { path: "/credits", element: <CreditsPage /> },
  { path: "/pricing", element: <PricingGuidePage /> },
  { path: "/notifications", element: <NotificationsPage /> },
  { path: "/knowledge", element: <KnowledgeBasePage /> },
  { path: "/recipes", element: <RecipesPage /> },
  { path: "/appexchange", element: <AppExchangePage /> },
  { path: "/news", element: <NewsPage /> },
  { path: "/extensions", element: <ExtensionsPage /> },
  { path: "/why-choose-us", element: <WhyChooseUsPage /> },
  { path: "/about", element: <AboutContactPage /> },
  { path: "/profile", element: <ProfilePage /> },
];

export const adminRoutes: RouteConfig[] = [
  { path: "/admin", element: <AdminDashboardPage /> },
  { path: "/admin/tickets", element: <AdminTicketsPage /> },
  { path: "/admin/notifications", element: <AdminNotificationsPage /> },
  { path: "/admin/users", element: <AdminUsersPage /> },
  { path: "/admin/articles", element: <AdminArticlesPage /> },
  { path: "/admin/credits", element: <AdminCreditsPage /> },
  { path: "/admin/recipes", element: <AdminRecipesPage /> },
  { path: "/admin/appexchange", element: <AdminAppExchangePage /> },
  { path: "/admin/news", element: <AdminNewsPage /> },
  { path: "/admin/extensions", element: <AdminExtensionsPage /> },
  { path: "/admin/contacts", element: <AdminContactSubmissionsPage /> },
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

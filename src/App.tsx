import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import TicketsPage from "./pages/TicketsPage";
import NewTicketPage from "./pages/NewTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import CreditsPage from "./pages/CreditsPage";
import PricingGuidePage from "./pages/PricingGuidePage";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/NotificationsPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminTicketsPage from "./pages/admin/AdminTicketsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminArticlesPage from "./pages/admin/AdminArticlesPage";
import AdminCreditsPage from "./pages/admin/AdminCreditsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import RecipesPage from "./pages/RecipesPage";
import AdminRecipesPage from "./pages/admin/AdminRecipesPage";
import AppExchangePage from "./pages/AppExchangePage";
import NewsPage from "./pages/NewsPage";
import ExtensionsPage from "./pages/ExtensionsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/new" element={<NewTicketPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/pricing" element={<PricingGuidePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/tickets" element={<AdminTicketsPage />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/articles" element={<AdminArticlesPage />} />
            <Route path="/admin/credits" element={<AdminCreditsPage />} />
            <Route path="/admin/recipes" element={<AdminRecipesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdmin";
import { AppLayout } from "@/components/AppLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ProjectDetail from "./pages/ProjectDetail";
import ChatWorkspace from "./pages/ChatWorkspace";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminUsage from "./pages/admin/AdminUsage";
import AdminModels from "./pages/admin/AdminModels";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminErrors from "./pages/admin/AdminErrors";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminFeatureFlags from "./pages/admin/AdminFeatureFlags";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminShareLinks from "./pages/admin/AdminShareLinks";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminSystemHealth from "./pages/admin/AdminSystemHealth";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return <Navigate to="/chat" replace />;
  return <>{children}</>;
}

function LandingRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return <Navigate to="/chat" replace />;
  return <Landing />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  if (authLoading || adminLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/chat" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingRoute />} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatWorkspace /></AppLayout></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><AppLayout><ChatWorkspace /></AppLayout></ProtectedRoute>} />
            <Route path="/project/:id" element={<ProtectedRoute><AppLayout><ProjectDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
            <Route path="/admin/usage" element={<AdminRoute><AdminUsage /></AdminRoute>} />
            <Route path="/admin/models" element={<AdminRoute><AdminModels /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/errors" element={<AdminRoute><AdminErrors /></AdminRoute>} />
            <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
            <Route path="/admin/feature-flags" element={<AdminRoute><AdminFeatureFlags /></AdminRoute>} />
            <Route path="/admin/templates" element={<AdminRoute><AdminTemplates /></AdminRoute>} />
            <Route path="/admin/share-links" element={<AdminRoute><AdminShareLinks /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
            <Route path="/admin/health" element={<AdminRoute><AdminSystemHealth /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

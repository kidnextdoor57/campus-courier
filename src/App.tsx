import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Student Pages
import Browse from "./pages/student/Browse";
import VendorMenu from "./pages/student/VendorMenu";
import Cart from "./pages/student/Cart";
import Orders from "./pages/student/Orders";

// Vendor Pages
import VendorDashboard from "./pages/vendor/Dashboard";

// Rider Pages
import RiderDashboard from "./pages/rider/Dashboard";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role || null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => setUserRole(data?.role || null));
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (userRole && !allowedRoles.includes(userRole)) return <Navigate to="/" />;

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Student Routes */}
          <Route path="/student/browse" element={<ProtectedRoute allowedRoles={["student"]}><Browse /></ProtectedRoute>} />
          <Route path="/student/vendor/:vendorId" element={<ProtectedRoute allowedRoles={["student"]}><VendorMenu /></ProtectedRoute>} />
          <Route path="/student/cart" element={<ProtectedRoute allowedRoles={["student"]}><Cart /></ProtectedRoute>} />
          <Route path="/student/orders" element={<ProtectedRoute allowedRoles={["student"]}><Orders /></ProtectedRoute>} />
          
          {/* Vendor Routes */}
          <Route path="/vendor/dashboard" element={<ProtectedRoute allowedRoles={["vendor"]}><VendorDashboard /></ProtectedRoute>} />
          
          {/* Rider Routes */}
          <Route path="/rider/dashboard" element={<ProtectedRoute allowedRoles={["rider"]}><RiderDashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
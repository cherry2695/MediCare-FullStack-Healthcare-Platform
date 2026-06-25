import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Prescriptions = lazy(() => import("@/pages/Prescriptions"));
const PriceComparison = lazy(() => import("@/pages/PriceComparison"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Authentication redirection wrapper
function AuthRedirect({ 
  children, 
  isAuthenticated, 
  redirectPath 
}: { 
  children: React.ReactNode; 
  isAuthenticated: boolean; 
  redirectPath: string;
}) {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(redirectPath);
    }
  }, [isAuthenticated, navigate, redirectPath]);

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

// Main router component with auth handling
function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // If it's still loading, show the loader
  if (isLoading) {
    return <PageLoader />;
  }

  const isAuthenticated = !!user;
  const isLoginPage = location === "/login" || location === "/register";
  
  // Redirect already logged in users away from login page
  if (isAuthenticated && isLoginPage) {
    return <Navigate to="/" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes */}
        <Route path="/login">
          <Login />
        </Route>
        <Route path="/register">
          <Register />
        </Route>

        {/* Protected routes */}
        <Route path="/">
          {!isAuthenticated && <Navigate to="/login" />}
          {isAuthenticated && <Dashboard />}
        </Route>
        <Route path="/prescriptions">
          {!isAuthenticated && <Navigate to="/login" />}
          {isAuthenticated && <Prescriptions />}
        </Route>
        <Route path="/price-comparison">
          {!isAuthenticated && <Navigate to="/login" />}
          {isAuthenticated && <PriceComparison />}
        </Route>
        <Route path="/profile">
          {!isAuthenticated && <Navigate to="/login" />}
          {isAuthenticated && <Profile />}
        </Route>
        <Route path="/settings">
          {!isAuthenticated && <Navigate to="/login" />}
          {isAuthenticated && <Settings />}
        </Route>
        
        {/* Fallback route */}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Suspense>
  );
}

// Helper component for navigation
function Navigate({ to }: { to: string }) {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="medicare-theme">
        <TooltipProvider>
          <AuthProvider>
            {/* ShadCN Toaster */}
            <Toaster />
            {/* Sonner Toaster for custom medication reminders */}
            <SonnerToaster 
              position="top-right"
              toastOptions={{
                style: { 
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  padding: 0,
                  margin: 0,
                  border: 'none',
                },
              }}
            />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

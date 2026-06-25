import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import TopNavBar from "@/components/TopNavBar";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user && !location.startsWith("/login") && !location.startsWith("/register")) {
      setLocation("/login");
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNavBar />
      
      <div className="flex pt-[50px] pb-16">
        <Sidebar />
        
        <motion.main 
          className="flex-1 relative z-0 overflow-y-auto focus:outline-none px-4 sm:px-6 lg:px-8 pt-4 pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
      
      <MobileNavigation />
    </div>
  );
}

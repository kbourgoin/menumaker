
import { ReactNode } from "react";
import { Header } from "@/components/layout";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth";
import { Navigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { PerformanceMonitor } from "@/components/dev";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If not loading and not authenticated, redirect to auth page
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cream-50 to-sage-50">
      {/* Skip navigation link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      <Header />
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress className="h-1 bg-terracotta-100" value={100} />
        </div>
      )}
      <motion.main 
        id="main-content"
        className="flex-1 container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        role="main"
        aria-label="Main content"
      >
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mb-4"></div>
            <p className="text-muted-foreground">Loading your data...</p>
          </div>
        ) : (
          children
        )}
      </motion.main>
      <footer className="py-6 border-t border-terracotta-100 bg-cream-50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">Keith Bourgoin © {new Date().getFullYear()}</p>
        </div>
      </footer>
      
      {/* Development performance monitor */}
      <PerformanceMonitor />
    </div>
  );
};

export default Layout;

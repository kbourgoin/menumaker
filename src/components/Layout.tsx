
import { ReactNode } from "react";
import Header from "./Header";
import { motion } from "framer-motion";
import { useAuth } from "./AuthProvider";
import { Navigate } from "react-router-dom";

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
      <Header />
      <motion.main 
        className="flex-1 container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
          </div>
        ) : (
          children
        )}
      </motion.main>
      <footer className="py-6 border-t border-terracotta-100 bg-cream-50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">Family Meal Memories © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

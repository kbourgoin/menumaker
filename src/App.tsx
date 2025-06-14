
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const AllDishes = lazy(() => import("./pages/AllMeals"));
const AddDish = lazy(() => import("./pages/AddMeal"));
const WeeklyMenu = lazy(() => import("./pages/WeeklyMenu"));
const MealDetail = lazy(() => import("./pages/MealDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/all-meals" element={<AllDishes />} />
                  <Route path="/add-meal" element={<AddDish />} />
                  <Route path="/weekly-menu" element={<WeeklyMenu />} />
                  <Route path="/meal/:id" element={<MealDetail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

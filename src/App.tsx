import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth";
import { ErrorBoundary } from "@/components/shared";
import { LoadingSpinner } from "@/components/shared";
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
                  <Route
                    path="/auth"
                    element={
                      <ErrorBoundary context="auth-page">
                        <Auth />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <ErrorBoundary context="dashboard-page">
                        <Index />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/all-meals"
                    element={
                      <ErrorBoundary context="all-meals-page">
                        <AllDishes />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/add-meal"
                    element={
                      <ErrorBoundary context="add-meal-page">
                        <AddDish />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/weekly-menu"
                    element={
                      <ErrorBoundary context="weekly-menu-page">
                        <WeeklyMenu />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/meal/:id"
                    element={
                      <ErrorBoundary context="meal-detail-page">
                        <MealDetail />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ErrorBoundary context="settings-page">
                        <Settings />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <ErrorBoundary context="not-found-page">
                        <NotFound />
                      </ErrorBoundary>
                    }
                  />
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

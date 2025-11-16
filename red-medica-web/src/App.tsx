import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { NotificationSystem } from "@/components/NotificationSystem";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PerformanceProvider } from "@/components/PerformanceProvider";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { initializeServices, cleanupServices } from "@/services";
import { recordPageLoad } from "@/services/performanceMonitor";
import { useAppStore } from "@/lib/store";
import type { Product } from "@/lib/mockData";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Connect = lazy(() => import("./pages/Connect"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Register = lazy(() => import("./pages/Register"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Verify = lazy(() => import("./pages/Verify"));
const Transfer = lazy(() => import("./pages/Transfer"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Profile = lazy(() => import("./pages/Profile"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname !== '/' && <OnboardingFlow />}
      <PerformanceProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/transfer/:productId" element={<Transfer />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </PerformanceProvider>
    </>
  );
}

const App = () => {
  useEffect(() => {
    // Record app initialization start time
    const appStartTime = Date.now();
    
    // Initialize services when app starts
    initializeServices().catch(console.error);
    
    // Load saved products from localStorage
    const loadSavedProducts = () => {
      try {
        const savedProducts = localStorage.getItem('redMedicaProducts');
        if (savedProducts) {
          const products = JSON.parse(savedProducts);
          const { addProduct } = useAppStore.getState();
          
          // Add each saved product to the store
          products.forEach((product: Product) => {
            addProduct(product);
          });
          
          console.log(`✅ Loaded ${products.length} saved products from localStorage`);
        }
      } catch (error) {
        console.error('❌ Failed to load saved products:', error);
      }
    };
    
    loadSavedProducts();
    
    // Record app initialization completion
    const initializationTime = Date.now() - appStartTime;
    recordPageLoad('app_initialization', initializationTime);
    
    // Cleanup services when app unmounts
    return () => {
      cleanupServices();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NotificationSystem />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

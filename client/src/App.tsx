import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { LoadingState } from "./components/States";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { StoreProvider } from "./contexts/StoreContext";
import "./brand.css";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const CollectionsIndex = lazy(() => import("./pages/Collections").then((module) => ({ default: module.CollectionsIndex })));
const CategoryPage = lazy(() => import("./pages/Collections").then((module) => ({ default: module.CategoryPage })));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const AboutPage = lazy(() => import("./pages/ContentPages").then((module) => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import("./pages/ContentPages").then((module) => ({ default: module.ContactPage })));
const FaqPage = lazy(() => import("./pages/ContentPages").then((module) => ({ default: module.FaqPage })));
const PolicyPage = lazy(() => import("./pages/ContentPages").then((module) => ({ default: module.PolicyPage })));
const AdminGuard = lazy(() => import("./pages/AdminLayout").then((module) => ({ default: module.AdminGuard })));
const AdminLogin = lazy(() => import("./pages/AdminLayout").then((module) => ({ default: module.AdminLogin })));
const AdminOverview = lazy(() => import("./pages/AdminLayout").then((module) => ({ default: module.AdminOverview })));
const AdminProductEditor = lazy(() => import("./pages/AdminProducts").then((module) => ({ default: module.AdminProductEditor })));
const AdminProducts = lazy(() => import("./pages/AdminProducts").then((module) => ({ default: module.AdminProducts })));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const PublicNotFound = lazy(() => import("./pages/PublicNotFound"));

function Router() {
  return (
    <Suspense fallback={<div className="page-container"><LoadingState label="Loading the page" /></div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/collections" component={CollectionsIndex} />
        <Route path="/collections/:slug" component={CategoryPage} />
        <Route path="/product/:slug" component={ProductDetail} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/faq" component={FaqPage} />
        <Route path="/sizing" component={() => <PolicyPage kind="sizing" />} />
        <Route path="/delivery" component={() => <PolicyPage kind="delivery" />} />
        <Route path="/exchanges" component={() => <PolicyPage kind="exchanges" />} />
        <Route path="/privacy" component={() => <PolicyPage kind="privacy" />} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/products/new" component={() => <AdminGuard><AdminProductEditor /></AdminGuard>} />
        <Route path="/admin/products/:id/edit" component={() => <AdminGuard><AdminProductEditor /></AdminGuard>} />
        <Route path="/admin/products" component={() => <AdminGuard><AdminProducts /></AdminGuard>} />
        <Route path="/admin/categories" component={() => <AdminGuard><AdminCategories /></AdminGuard>} />
        <Route path="/admin/settings" component={() => <AdminGuard><AdminSettings /></AdminGuard>} />
        <Route path="/admin" component={() => <AdminGuard><AdminOverview /></AdminGuard>} />
        <Route path="/404" component={PublicNotFound} />
        <Route component={PublicNotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <StoreProvider>
              <Router />
            </StoreProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

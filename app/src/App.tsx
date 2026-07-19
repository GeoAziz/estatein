import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { CompareProvider } from "./components/CompareBar";
import { AuthProvider, ProtectedRoute } from "./lib/auth-api";
import { ToastProvider } from "./lib/toast";
import { ConfirmProvider } from "./lib/confirm";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import Properties from "./pages/Properties";
import PropertiesForSale from "./pages/PropertiesForSale";
import PropertiesForRent from "./pages/PropertiesForRent";
import NewConstruction from "./pages/NewConstruction";
import ComingSoon from "./pages/ComingSoon";
import PropertyDetails from "./pages/PropertyDetails";
import MapSearchPage from "./pages/MapSearchPage";
import CompareProperties from "./pages/CompareProperties";
import Pricing from "./pages/Pricing";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import Blog from "./pages/Blog";
import MortgageCalculator from "./pages/MortgageCalculator";
import MarketTrends from "./pages/MarketTrends";
import BuyingGuide from "./pages/BuyingGuide";
import SellingGuide from "./pages/SellingGuide";
import RentalGuide from "./pages/RentalGuide";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Sitemap from "./pages/Sitemap";
import Cookies from "./pages/Cookies";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import BuyerDashboard from "./pages/dashboard/BuyerDashboard";
import AgentDashboard from "./pages/dashboard/AgentDashboard";
import PropertyManagerDashboard from "./pages/dashboard/PropertyManagerDashboard";
// DeveloperDashboard deferred to v2 (new-construction sales — out of MVP scope)
import AdminOverview from "./pages/dashboard/admin/AdminOverview";
import AdminPendingListings from "./pages/dashboard/admin/AdminPendingListings";
import AdminUsers from "./pages/dashboard/admin/AdminUsers";
import AdminReported from "./pages/dashboard/admin/AdminReported";
import AdminSupport from "./pages/dashboard/admin/AdminSupport";
import AnalyticsDashboard from "./pages/dashboard/AnalyticsDashboard";
import Settings from "./pages/dashboard/Settings";
import ListingWizard from "./pages/agent/ListingWizard";
import ManageListings from "./pages/agent/ManageListings";
import AgentInbox from "./pages/agent/AgentInbox";
import SiteSEO from "./components/SiteSEO";
import Analytics from "./components/Analytics";
import DemoBanner from "./components/DemoBanner";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <ConfirmProvider>
      <CompareProvider>
      <SiteSEO />
      <Analytics />
      <BrowserRouter>
        <DemoBanner />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<AboutUs />} />
            <Route path="properties" element={<Properties />} />
            <Route path="properties/for-sale" element={<PropertiesForSale />} />
            <Route path="properties/for-rent" element={<PropertiesForRent />} />
            <Route path="properties/new-construction" element={<NewConstruction />} />
            <Route path="properties/coming-soon" element={<ComingSoon />} />
            <Route path="properties/:slug" element={<PropertyDetails />} />
            <Route path="map-search" element={<MapSearchPage />} />
            <Route path="compare" element={<CompareProperties />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="services" element={<Services />} />
            <Route path="contact" element={<Contact />} />
            <Route path="careers" element={<Careers />} />
            <Route path="press" element={<Press />} />
            <Route path="blog" element={<Blog />} />
            <Route path="mortgage-calculator" element={<MortgageCalculator />} />
            <Route path="market-trends" element={<MarketTrends />} />
            <Route path="buying-guide" element={<BuyingGuide />} />
            <Route path="selling-guide" element={<SellingGuide />} />
            <Route path="rental-guide" element={<RentalGuide />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="sitemap" element={<Sitemap />} />
            <Route path="cookies" element={<Cookies />} />
            <Route path="support" element={<Support />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Auth pages — standalone, no marketing header/footer */}
          <Route path="signup" element={<SignUp />} />
          <Route path="login" element={<Login />} />
          <Route path="signin" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />

          {/* Dashboards — role-protected */}
          <Route
            path="dashboard/buyer"
            element={
              <ProtectedRoute allow={["buyer"]}>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/agent"
            element={
              <ProtectedRoute allow={["agent"]}>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
          {/* DeveloperDashboard deferred to v2 */}
          <Route
            path="dashboard/property-manager"
            element={
              <ProtectedRoute allow={["property_manager"]}>
                <PropertyManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AdminOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dashboard/pending"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AdminPendingListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dashboard/users"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dashboard/reported"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AdminReported />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dashboard/support"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AdminSupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dashboard/analytics"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Agent listing management — agent-protected */}
          <Route
            path="agent/listings"
            element={
              <ProtectedRoute allow={["agent"]}>
                <ManageListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="agent/listings/new"
            element={
              <ProtectedRoute allow={["agent"]}>
                <ListingWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="agent/listings/:id/edit"
            element={
              <ProtectedRoute allow={["agent"]}>
                <ListingWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="agent/messages"
            element={
              <ProtectedRoute allow={["agent"]}>
                <AgentInbox />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      </CompareProvider>
      </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

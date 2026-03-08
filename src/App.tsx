
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import FamilyTree from "./pages/FamilyTree";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UpdatePassword from "./pages/UpdatePassword";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";
import ProfileSettings from "./pages/ProfileSettings";
import Feed from "./pages/Feed";
import ReferAndEarn from "./pages/ReferAndEarn";
import SinglePost from "./pages/SinglePost";
import SingleUpdate from "./pages/SingleUpdate";
import { LegacyVault } from "./components/vault/LegacyVault";
import DocumentVault from "./components/documents/DocumentVault";
import { TagManagerWrapper } from "./components/tags/TagManagerWrapper";
import WalletPage from "./pages/Wallet";
import OfferPage from "./pages/OfferPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import ContactUs from "./pages/ContactUs";
import DataDeletionRequest from "./pages/DataDeletionRequest";
import ChildSafetyStandards from "./pages/ChildSafetyStandards";
import BlogListing from "./pages/BlogListing";
import BlogDetail from "./pages/BlogDetail";
import AppDownload from "./pages/AppDownload";
import PublicTree from "./pages/PublicTree";
import Messages from "./pages/Messages";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/data-deletion-request" element={<DataDeletionRequest />} />
              <Route path="/child-safety-standards" element={<ChildSafetyStandards />} />
              <Route path="/post/:id" element={<SinglePost />} />
              <Route path="/update/:id" element={<SingleUpdate />} />
              <Route path="/blog" element={<BlogListing />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/app" element={<AppDownload />} />
              <Route path="/shared-tree/:token" element={<PublicTree />} />

              {/* Authenticated Routes wrapped in MainLayout */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/tree/:treeId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <FamilyTree />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/tree" element={
                <MainLayout>
                  <FamilyTree />
                </MainLayout>
              } />
              <Route path="/settings/profile" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ProfileSettings />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/vault" element={
                <ProtectedRoute>
                  <MainLayout>
                    <LegacyVault />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/feed" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Feed />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/refer" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ReferAndEarn />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/tree/:treeId/documents" element={
                <ProtectedRoute>
                  <MainLayout>
                    <DocumentVault />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/tree/:treeId/tags" element={
                <ProtectedRoute>
                  <MainLayout>
                    <div className="container mx-auto py-8">
                      <TagManagerWrapper />
                    </div>
                  </MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/messages" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Messages />
                  </MainLayout>
                </ProtectedRoute>
              } />

              {/* Public Profile - specific username route */}
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <MainLayout>
                    <WalletPage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/offer-page" element={
                <MainLayout>
                  <OfferPage />
                </MainLayout>
              } />
              <Route path="/:username" element={<PublicProfile />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

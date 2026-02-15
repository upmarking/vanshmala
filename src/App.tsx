
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
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";
import ProfileSettings from "./pages/ProfileSettings";
import Feed from "./pages/Feed";
import ReferAndEarn from "./pages/ReferAndEarn";
import { LegacyVault } from "./components/vault/LegacyVault";
import DocumentVault from "./components/documents/DocumentVault";
import { TagManagerWrapper } from "./components/tags/TagManagerWrapper";
import WalletPage from "./pages/Wallet";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

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

              {/* Public Profile - specific username route */}
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <MainLayout>
                    <WalletPage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/:username" element={<PublicProfile />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

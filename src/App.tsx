
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import FamilyTree from "./pages/FamilyTree";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";
import ProfileSettings from "./pages/ProfileSettings";
import WalletPage from "./pages/Wallet";
import ReferralsPage from "./pages/Referrals";
import { LegacyVault } from "./components/vault/LegacyVault";
import DocumentVault from "./components/documents/DocumentVault";
import { TagManagerWrapper } from "./components/tags/TagManagerWrapper";

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
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/tree/:treeId" element={
                <ProtectedRoute><FamilyTree /></ProtectedRoute>
              } />
              <Route path="/tree" element={<FamilyTree />} />
              <Route path="/settings/profile" element={
                <ProtectedRoute><ProfileSettings /></ProtectedRoute>
              } />
              <Route path="/vault" element={
                <ProtectedRoute><LegacyVault /></ProtectedRoute>
              } />
              <Route path="/wallet" element={
                <ProtectedRoute><WalletPage /></ProtectedRoute>
              } />
              <Route path="/referrals" element={
                <ProtectedRoute><ReferralsPage /></ProtectedRoute>
              } />
              <Route path="/tree/:treeId/documents" element={
                <ProtectedRoute><DocumentVault /></ProtectedRoute>
              } />
              <Route path="/tree/:treeId/tags" element={
                <ProtectedRoute>
                  <div className="container mx-auto py-8">
                    <TagManagerWrapper />
                  </div>
                </ProtectedRoute>
              } />

              {/* Public Profile - specific username route */}
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

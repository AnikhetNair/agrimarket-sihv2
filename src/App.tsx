import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';

// Role Layouts
import { FarmerLayout } from './components/layout/FarmerLayout';
import { FpoLayout } from './components/layout/FpoLayout';
import { BuyerLayout } from './components/layout/BuyerLayout';

// Farmer Pages
import { FarmerDashboardPage } from './pages/farmer/FarmerDashboardPage';
import { FarmerMarketPage } from './pages/farmer/FarmerMarketPage';
import { FarmerLotsPage } from './pages/farmer/FarmerLotsPage';
import { FarmerDealsPage } from './pages/farmer/FarmerDealsPage';
import { FarmerDisputesPage } from './pages/farmer/FarmerDisputesPage';
import { FarmerAlertsPage } from './pages/farmer/FarmerAlertsPage';

// FPO Pages
import { FpoDashboardPage } from './pages/fpo/FpoDashboardPage';
import { FpoMembersPage } from './pages/fpo/FpoMembersPage';
import { FpoAggregationPage } from './pages/fpo/FpoAggregationPage';
import { FpoLotsPage } from './pages/fpo/FpoLotsPage';
import { FpoAnalyticsPage } from './pages/fpo/FpoAnalyticsPage';
import { FpoDisputesPage } from './pages/fpo/FpoDisputesPage';

// Buyer Pages
import { BuyerDashboardPage } from './pages/buyer/BuyerDashboardPage';
import { BuyerProcurementPage } from './pages/buyer/BuyerProcurementPage';
import { BuyerMatchesPage } from './pages/buyer/BuyerMatchesPage';
import { BuyerDealsPage } from './pages/buyer/BuyerDealsPage';
import { BuyerDisputesPage } from './pages/buyer/BuyerDisputesPage';
import { BuyerLogisticsPage } from './pages/buyer/BuyerLogisticsPage';

// Root redirect handler
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'FARMER') return <Navigate to="/farmer" replace />;
  if (role === 'FPO') return <Navigate to="/fpo" replace />;
  if (role === 'BUYER') return <Navigate to="/buyer" replace />;

  return <Navigate to="/login" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect based on role */}
          <Route path="/" element={<RootRedirect />} />

          {/* Farmer Route Tree (Protected) */}
          <Route path="/farmer" element={<FarmerLayout />}>
            <Route index element={<FarmerDashboardPage />} />
            <Route path="market" element={<FarmerMarketPage />} />
            <Route path="lots" element={<FarmerLotsPage />} />
            <Route path="lots/:lotId" element={<FarmerLotsPage />} />
            <Route path="deals" element={<FarmerDealsPage />} />
            <Route path="deals/:dealId" element={<FarmerDealsPage />} />
            <Route path="disputes" element={<FarmerDisputesPage />} />
            <Route path="alerts" element={<FarmerAlertsPage />} />
          </Route>

          {/* FPO Route Tree (Protected) */}
          <Route path="/fpo" element={<FpoLayout />}>
            <Route index element={<FpoDashboardPage />} />
            <Route path="members" element={<FpoMembersPage />} />
            <Route path="aggregation" element={<FpoAggregationPage />} />
            <Route path="lots" element={<FpoLotsPage />} />
            <Route path="analytics" element={<FpoAnalyticsPage />} />
            <Route path="disputes" element={<FpoDisputesPage />} />
          </Route>

          {/* Buyer Route Tree (Protected) */}
          <Route path="/buyer" element={<BuyerLayout />}>
            <Route index element={<BuyerDashboardPage />} />
            <Route path="procurement" element={<BuyerProcurementPage />} />
            <Route path="matches" element={<BuyerMatchesPage />} />
            <Route path="matches/:matchId" element={<BuyerMatchesPage />} />
            <Route path="deals" element={<BuyerDealsPage />} />
            <Route path="disputes" element={<BuyerDisputesPage />} />
            <Route path="logistics" element={<BuyerLogisticsPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

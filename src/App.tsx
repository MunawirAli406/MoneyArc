import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './features/auth/LoginPage';
import SignUpPage from './features/auth/SignUpPage';
import DataSourceSelect from './features/onboarding/DataSourceSelect';
import CompanySelect from './features/onboarding/CompanySelect';
import Dashboard from './features/dashboard/Dashboard';
import SettingsPage from './features/settings/SettingsPage';
import LedgerManagement from './features/accounting/masters/LedgerManagement';
import LedgerForm from './features/accounting/masters/LedgerForm';
import VoucherEntry from './features/accounting/vouchers/VoucherEntry';
import BalanceSheet from './features/reports/BalanceSheet';
import ProfitAndLoss from './features/reports/ProfitAndLoss';
import TrialBalance from './features/reports/TrialBalance';
import GstReport from './features/reports/GstReport';
import Gstr1Report from './features/reports/Gstr1Report';
import Gstr3bReport from './features/reports/Gstr3bReport';
import RatioAnalysis from './features/reports/RatioAnalysis';
import AuditLogViewer from './features/security/AuditLogViewer';
import CashFlow from './features/reports/CashFlow';
import FundFlow from './features/reports/FundFlow';
import Daybook from './features/reports/Daybook';
import UnitList from './features/inventory/UnitList';
import UnitForm from './features/inventory/UnitForm';

import StockItemForm from './features/inventory/StockItemForm';
import StockGroupList from './features/inventory/StockGroupList';
import StockGroupForm from './features/inventory/StockGroupForm';
import StockSummary from './features/reports/StockSummary';
import StockVoucherReport from './features/reports/StockVoucherReport';
import InventoryMaster from './features/inventory/InventoryMaster';
import { PersistenceProvider } from './services/persistence/PersistenceContext';
import { AuthProvider } from './features/auth/AuthContext';
import { useAuth } from './features/auth/AuthContext.provider';
import { ThemeProvider } from './features/settings/ThemeContext';
import { DateProvider } from './features/reports/DateContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const navigate = useNavigate();
  console.log('AppContent: Rendering routes...');
  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + Key combinations
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            navigate('/vouchers/new');
            break;
          case 'd':
            e.preventDefault();
            navigate('/reports/daybook');
            break;
          case 's':
            e.preventDefault();
            navigate('/reports/stock-summary');
            break;
          case 'b':
            e.preventDefault();
            navigate('/reports/balance-sheet');
            break;
          case 'h': // Home/Dashboard
            e.preventDefault();
            navigate('/dashboard');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/select-source" element={<DataSourceSelect />} />
      <Route path="/select-company" element={<CompanySelect />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="ledgers" element={<LedgerManagement />} />
        <Route path="ledgers/new" element={<LedgerForm />} />
        <Route path="ledgers/:id" element={<LedgerForm />} />
        <Route path="vouchers/new" element={<VoucherEntry />} />
        <Route path="vouchers/edit/:id" element={<VoucherEntry />} />
        <Route path="reports/balance-sheet" element={<BalanceSheet />} />
        <Route path="reports/profit-loss" element={<ProfitAndLoss />} />
        <Route path="reports/trial-balance" element={<TrialBalance />} />
        <Route path="reports/gst" element={<GstReport />} />
        <Route path="reports/gst/r1" element={<Gstr1Report />} />
        <Route path="reports/gst/r3b" element={<Gstr3bReport />} />
        <Route path="reports/ratios" element={<RatioAnalysis />} />
        <Route path="security/audit" element={<AuditLogViewer />} />
        <Route path="reports/cash-flow" element={<CashFlow />} />
        <Route path="reports/fund-flow" element={<FundFlow />} />
        <Route path="reports/daybook" element={<Daybook />} />

        {/* Inventory Routes */}
        <Route path="inventory/units" element={<UnitList />} />
        <Route path="inventory/units/new" element={<UnitForm />} />
        <Route path="inventory/units/:id" element={<UnitForm />} />
        <Route path="inventory/master" element={<InventoryMaster />} />
        <Route path="inventory/items" element={<Navigate to="/inventory/master" replace />} />
        <Route path="inventory/items/new" element={<StockItemForm />} />
        <Route path="inventory/items/:id" element={<StockItemForm />} />
        <Route path="inventory/groups" element={<StockGroupList />} />
        <Route path="inventory/groups/new" element={<StockGroupForm />} />
        <Route path="inventory/groups/:id" element={<StockGroupForm />} />
        <Route path="reports/stock-summary" element={<StockSummary />} />
        <Route path="reports/stock-voucher/:itemId" element={<StockVoucherReport />} />

        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <PersistenceProvider>
      <ThemeProvider>
        <AuthProvider>
          <DateProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </DateProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistenceProvider>
  );
}

export default App;


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
import SecurityCenter from './features/security/SecurityCenter';
import DataPortability from './features/utilities/DataPortability';
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
import { PersistenceProvider, usePersistence } from './services/persistence/PersistenceContext';
import { AuthProvider } from './features/auth/AuthContext';
import { useAuth } from './features/auth/AuthContext.provider';
import { ThemeProvider } from './features/settings/ThemeContext';
import { DateProvider } from './features/reports/DateContext';
import { NotificationProvider } from './services/notifications/NotificationContext';
import DynamicBackground from './components/layout/DynamicBackground';
import PageTransition from './components/layout/PageTransition';
import { AnimatePresence } from 'framer-motion';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { provider } = usePersistence();
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

  if (!provider && location.pathname !== '/select-source') {
    return <Navigate to="/select-source" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const navigate = useNavigate();
  const { isInitialized, isSyncing } = usePersistence();

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

  if (!isInitialized || isSyncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A]">
        <div className="mb-8 p-1">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-primary/20 rounded-full animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.3)]" />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em] animate-pulse">Initializing</h2>
        <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.2em] mt-6 flex items-center gap-3">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          Synchronizing Workspace
        </p>
      </div>
    );
  }

  console.log('AppContent: Rendering routes...');

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignUpPage /></PageTransition>} />
        <Route path="/select-source" element={<PageTransition><DataSourceSelect /></PageTransition>} />
        <Route path="/select-company" element={<PageTransition><CompanySelect /></PageTransition>} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="ledgers" element={<PageTransition><LedgerManagement /></PageTransition>} />
          <Route path="ledgers/new" element={<PageTransition><LedgerForm /></PageTransition>} />
          <Route path="ledgers/:id" element={<PageTransition><LedgerForm /></PageTransition>} />
          <Route path="vouchers/new" element={<PageTransition><VoucherEntry /></PageTransition>} />
          <Route path="vouchers/edit/:id" element={<PageTransition><VoucherEntry /></PageTransition>} />
          <Route path="reports/balance-sheet" element={<PageTransition><BalanceSheet /></PageTransition>} />
          <Route path="reports/profit-loss" element={<PageTransition><ProfitAndLoss /></PageTransition>} />
          <Route path="reports/trial-balance" element={<PageTransition><TrialBalance /></PageTransition>} />
          <Route path="reports/gst" element={<PageTransition><GstReport /></PageTransition>} />
          <Route path="reports/gst/r1" element={<PageTransition><Gstr1Report /></PageTransition>} />
          <Route path="reports/gst/r3b" element={<PageTransition><Gstr3bReport /></PageTransition>} />
          <Route path="reports/ratios" element={<PageTransition><RatioAnalysis /></PageTransition>} />
          <Route path="security" element={<PageTransition><SecurityCenter /></PageTransition>} />
          <Route path="security/audit" element={<PageTransition><AuditLogViewer /></PageTransition>} />
          <Route path="utility/portability" element={<PageTransition><DataPortability /></PageTransition>} />
          <Route path="reports/cash-flow" element={<PageTransition><CashFlow /></PageTransition>} />
          <Route path="reports/fund-flow" element={<PageTransition><FundFlow /></PageTransition>} />
          <Route path="reports/daybook" element={<PageTransition><Daybook /></PageTransition>} />

          {/* Inventory Routes */}
          <Route path="inventory/units" element={<PageTransition><UnitList /></PageTransition>} />
          <Route path="inventory/units/new" element={<PageTransition><UnitForm /></PageTransition>} />
          <Route path="inventory/units/:id" element={<PageTransition><UnitForm /></PageTransition>} />
          <Route path="inventory/master" element={<PageTransition><InventoryMaster /></PageTransition>} />
          <Route path="inventory/items" element={<Navigate to="/inventory/master" replace />} />
          <Route path="inventory/items/new" element={<PageTransition><StockItemForm /></PageTransition>} />
          <Route path="inventory/items/:id" element={<PageTransition><StockItemForm /></PageTransition>} />
          <Route path="inventory/groups" element={<PageTransition><StockGroupList /></PageTransition>} />
          <Route path="inventory/groups/new" element={<PageTransition><StockGroupForm /></PageTransition>} />
          <Route path="inventory/groups/:id" element={<PageTransition><StockGroupForm /></PageTransition>} />
          <Route path="reports/stock-summary" element={<PageTransition><StockSummary /></PageTransition>} />
          <Route path="reports/stock-voucher/:itemId" element={<PageTransition><StockVoucherReport /></PageTransition>} />

          <Route path="settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <NotificationProvider>
      <PersistenceProvider>
        <ThemeProvider>
          <AuthProvider>
            <DateProvider>
              <DynamicBackground />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </DateProvider>
          </AuthProvider>
        </ThemeProvider>
      </PersistenceProvider>
    </NotificationProvider>
  );
}

export default App;

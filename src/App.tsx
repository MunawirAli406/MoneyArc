import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './features/auth/LoginPage';
import SignUpPage from './features/auth/SignUpPage';
import DataSourceSelect from './features/onboarding/DataSourceSelect';
import CompanySelect from './features/onboarding/CompanySelect';
import Dashboard from './features/dashboard/Dashboard';
import SettingsPage from './features/settings/SettingsPage';
import LedgerList from './features/accounting/masters/LedgerList';
import LedgerForm from './features/accounting/masters/LedgerForm';
import VoucherEntry from './features/accounting/vouchers/VoucherEntry';
import BalanceSheet from './features/reports/BalanceSheet';
import ProfitAndLoss from './features/reports/ProfitAndLoss';
import GstReport from './features/reports/GstReport';
import Gstr1Report from './features/reports/Gstr1Report';
import Gstr3bReport from './features/reports/Gstr3bReport';
import RatioAnalysis from './features/reports/RatioAnalysis';
import AuditLogViewer from './features/security/AuditLogViewer';
import CashFlow from './features/reports/CashFlow';
import FundFlow from './features/reports/FundFlow';
import Daybook from './features/accounting/reports/Daybook';
import LedgerReport from './features/reports/LedgerReport';
import UnitList from './features/inventory/UnitList';
import UnitForm from './features/inventory/UnitForm';
import StockItemList from './features/inventory/StockItemList';
import StockItemForm from './features/inventory/StockItemForm';
import StockGroupList from './features/inventory/StockGroupList';
import StockGroupForm from './features/inventory/StockGroupForm';
import StockSummary from './features/inventory/StockSummary';
import { PersistenceProvider } from './services/persistence/PersistenceContext';
import { AuthProvider } from './features/auth/AuthContext';
import { useAuth } from './features/auth/AuthContext.provider';
import { ThemeProvider } from './features/settings/ThemeContext';

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
  console.log('AppContent: Rendering routes...');
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
        <Route path="ledgers" element={<LedgerList />} />
        <Route path="ledgers/new" element={<LedgerForm />} />
        <Route path="ledgers/:id" element={<LedgerForm />} />
        <Route path="vouchers/new" element={<VoucherEntry />} />
        <Route path="vouchers/edit/:id" element={<VoucherEntry />} />
        <Route path="reports/balance-sheet" element={<BalanceSheet />} />
        <Route path="reports/profit-loss" element={<ProfitAndLoss />} />
        <Route path="reports/gst" element={<GstReport />} />
        <Route path="reports/gst/r1" element={<Gstr1Report />} />
        <Route path="reports/gst/r3b" element={<Gstr3bReport />} />
        <Route path="reports/ratios" element={<RatioAnalysis />} />
        <Route path="security/audit" element={<AuditLogViewer />} />
        <Route path="reports/cash-flow" element={<CashFlow />} />
        <Route path="reports/fund-flow" element={<FundFlow />} />
        import LedgerReport from './features/reports/LedgerReport';

        // ... (other imports)

        // Inside Routes:
        <Route path="reports/cash-flow" element={<CashFlow />} />
        <Route path="reports/fund-flow" element={<FundFlow />} />
        <Route path="reports/ledger" element={<LedgerReport />} />
        <Route path="reports/daybook" element={<Daybook />} />

        {/* Inventory Routes */}
        <Route path="inventory/units" element={<UnitList />} />
        <Route path="inventory/units/new" element={<UnitForm />} />
        <Route path="inventory/units/:id" element={<UnitForm />} />
        <Route path="inventory/items" element={<StockItemList />} />
        <Route path="inventory/items/new" element={<StockItemForm />} />
        <Route path="inventory/items/:id" element={<StockItemForm />} />
        <Route path="inventory/groups" element={<StockGroupList />} />
        <Route path="inventory/groups/new" element={<StockGroupForm />} />
        <Route path="inventory/groups/:id" element={<StockGroupForm />} />
        <Route path="inventory/stock-summary" element={<StockSummary />} />

        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <PersistenceProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </PersistenceProvider>
    </ThemeProvider>
  );
}

export default App;


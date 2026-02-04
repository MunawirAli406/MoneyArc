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
import CashFlow from './features/reports/CashFlow';
import FundFlow from './features/reports/FundFlow';
import Daybook from './features/accounting/reports/Daybook';
import { PersistenceProvider } from './services/persistence/PersistenceContext';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
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
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      {/* Onboarding routes that might not require full layout or protection */}
      <Route path="/select-source" element={<DataSourceSelect />} />
      <Route path="/select-company" element={<CompanySelect />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {/* The select-source route was moved out of this protected layout */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="ledgers" element={<LedgerList />} />
        <Route path="ledgers/new" element={<LedgerForm />} />
        <Route path="vouchers" element={<VoucherEntry />} />
        <Route path="reports/balance-sheet" element={<BalanceSheet />} />
        <Route path="reports/profit-loss" element={<ProfitAndLoss />} />
        <Route path="reports/gst" element={<GstReport />} />
        <Route path="reports/cash-flow" element={<CashFlow />} />
        <Route path="reports/fund-flow" element={<FundFlow />} />
        <Route path="reports/daybook" element={<Daybook />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PersistenceProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </PersistenceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


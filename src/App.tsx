import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './features/auth/LoginPage';
import SignUpPage from './features/auth/SignUpPage';
import DataSourceSelect from './features/onboarding/DataSourceSelect';
import Dashboard from './features/dashboard/Dashboard';
import LedgerList from './features/accounting/masters/LedgerList';
import LedgerForm from './features/accounting/masters/LedgerForm';
import VoucherEntry from './features/accounting/vouchers/VoucherEntry';
import BalanceSheet from './features/reports/BalanceSheet';
import ProfitAndLoss from './features/reports/ProfitAndLoss';
import Daybook from './features/accounting/reports/Daybook';
import { PersistenceProvider } from './services/persistence/PersistenceContext';

function App() {
  return (
    <PersistenceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/select-source" element={<DataSourceSelect />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="ledgers" element={<LedgerList />} />
            <Route path="ledgers/new" element={<LedgerForm />} />
            <Route path="vouchers" element={<VoucherEntry />} />
            <Route path="reports/balance-sheet" element={<BalanceSheet />} />
            <Route path="reports/profit-loss" element={<ProfitAndLoss />} />
            <Route path="reports/daybook" element={<Daybook />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PersistenceProvider>
  );
}

export default App;

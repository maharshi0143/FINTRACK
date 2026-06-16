import { BrowserRouter, Routes, Route } from 'react-router-dom';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashBoardPage from '../pages/dashboard/DashBoardPage';
import TransactionPage from '../pages/transactions/TransactionPage';
import BudgetsPage from '../pages/budgets/BudgetsPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import AIAssistantPage from '../pages/ai/AIAssistantPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import ProfilePage from '../pages/profile/ProfilePage';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashBoardPage />} />
        <Route path="/transactions" element={<TransactionPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/ai" element={<AIAssistantPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;

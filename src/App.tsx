import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import BatteryDetailPage from './pages/BatteryDetailPage';
import DrillingPlanPage from './pages/DrillingPlanPage';
import AlertsPage from './pages/AlertsPage';
import PricingReportPage from './pages/PricingReportPage';
import { ToastProvider } from './components/Toast';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/battery" element={<BatteryDetailPage />} />
            <Route path="/drilling-plan" element={<DrillingPlanPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/pricing-report" element={<PricingReportPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;

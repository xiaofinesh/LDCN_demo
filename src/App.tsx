import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { ToastProvider } from './components/Toast';
import PageSkeleton from './components/PageSkeleton';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BatteryDetailPage = lazy(() => import('./pages/BatteryDetailPage'));
const DrillingPlanPage = lazy(() => import('./pages/DrillingPlanPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const PricingReportPage = lazy(() => import('./pages/PricingReportPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Suspense fallback={<PageSkeleton />}><DashboardPage /></Suspense>} />
            <Route path="/battery" element={<Suspense fallback={<PageSkeleton />}><BatteryDetailPage /></Suspense>} />
            <Route path="/drilling-plan" element={<Suspense fallback={<PageSkeleton />}><DrillingPlanPage /></Suspense>} />
            <Route path="/alerts" element={<Suspense fallback={<PageSkeleton />}><AlertsPage /></Suspense>} />
            <Route path="/pricing-report" element={<Suspense fallback={<PageSkeleton />}><PricingReportPage /></Suspense>} />
            <Route path="*" element={<Suspense fallback={<PageSkeleton />}><NotFoundPage /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;

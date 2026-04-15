import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import SplashScreen from './components/SplashScreen';
import DashboardPage from './pages/DashboardPage';
import SchedulingPage from './pages/SchedulingPage';
import BatteriesPage from './pages/BatteriesPage';
import PlatformsPage from './pages/PlatformsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import { useSimulation } from './hooks/useSimulation';

const App: React.FC = () => {
  const [splashDone, setSplashDone] = useState(false);
  const sim = useSimulation();

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout sim={sim} />}>
            <Route index element={<DashboardPage />} />
            <Route path="/scheduling" element={<SchedulingPage />} />
            <Route path="/batteries" element={<BatteriesPage />} />
            <Route path="/platforms" element={<PlatformsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;

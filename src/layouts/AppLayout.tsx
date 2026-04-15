import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { C } from '../constants/colors';
import type { UseSimulationResult } from '../hooks/useSimulation';

export interface AppLayoutContext {
  sim: UseSimulationResult;
}

const AppLayout: React.FC<{ sim: UseSimulationResult }> = ({ sim }) => {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: "'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif",
      }}
    >
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          simHour={sim.simHour}
          running={sim.running}
          setRunning={sim.setRunning}
          speed={sim.speed}
          setSpeed={sim.setSpeed}
        />
        <div style={{ flex: 1, padding: '20px 28px 28px', overflowX: 'hidden' }}>
          <Outlet context={{ sim } satisfies AppLayoutContext} />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;

import React from 'react';
import { C } from '../constants/tokens';

/**
 * Page-level skeleton shown while a lazy-loaded page is being fetched
 * or while initial data is loading. Uses a subtle shimmer animation.
 */
const PageSkeleton: React.FC = () => {
  return (
    <div style={{ padding: '8px 0' }}>
      <style>{`
        @keyframes skel-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skel {
          background: linear-gradient(90deg, ${C.divider} 0px, #ffffff 200px, ${C.divider} 400px);
          background-size: 800px 100%;
          border-radius: 8px;
          animation: skel-shimmer 1.4s linear infinite;
        }
      `}</style>

      {/* Page header */}
      <div className="skel" style={{ height: 34, width: 240, marginBottom: 10 }} />
      <div className="skel" style={{ height: 14, width: 360, marginBottom: 20 }} />

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skel"
            style={{ flex: 1, minWidth: 160, height: 102 }}
          />
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 16 }}>
        <div className="skel" style={{ height: 420 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skel" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;

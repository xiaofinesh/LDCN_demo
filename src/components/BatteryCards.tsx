import React from 'react';
import { C } from '../constants/colors';
import BatteryCard from './BatteryCard';
import type { Battery } from '../types';

interface BatteryCardsProps {
  batteries: Battery[];
  power: number;
}

const BatteryCards: React.FC<BatteryCardsProps> = ({ batteries, power }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec, padding: '0 4px' }}>电池状态</div>
      {batteries.map((b) => (
        <BatteryCard key={b.id} b={b} power={power} />
      ))}
    </div>
  );
};

export default BatteryCards;

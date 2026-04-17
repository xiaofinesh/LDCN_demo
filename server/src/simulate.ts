/**
 * Demo SOC/power drift simulation.
 * Each battery's SOC slowly trends based on its status,
 * plus small sinusoidal noise so the dashboard "feels alive".
 *
 * - supplying battery: SOC ↓ over time
 * - charging battery:  SOC ↑ over time
 * - standby/others:    minor fluctuation
 *
 * Tick every 5 seconds. Pure state mutation.
 */
import { state } from './state.js';

const TICK_MS = 5000;

export function startSimulation(): void {
  setInterval(tick, TICK_MS);
}

function tick(): void {
  for (const b of state.batteries) {
    const noise = (Math.random() - 0.5) * 0.3; // ±0.15% noise
    if (b.status === 'supplying') {
      // discharge ~10% per hour → 0.83%/5min → ~0.014%/5s * 60 = 0.8%/5min
      b.soc = clamp(b.soc - 0.15 + noise, 5, 100);
      b.current = -900 + Math.round(Math.random() * 60) - 30;
      b.power = Math.round((b.voltage * b.current) / 1000); // negative
      b.temp = clamp(b.temp + (Math.random() - 0.5) * 0.2, 28, 48);
    } else if (b.status === 'charging') {
      // charge fast → ~20%/h → 1.67%/5min
      b.soc = clamp(b.soc + 0.25 + noise, 5, 100);
      b.current = 2250 + Math.round(Math.random() * 80) - 40;
      b.power = Math.round((b.voltage * b.current) / 1000); // positive
      b.temp = clamp(b.temp + (Math.random() - 0.5) * 0.3, 28, 48);
    } else {
      // standby / transit
      b.soc = clamp(b.soc + noise, 0, 100);
      b.current = 0;
      b.power = 0;
      b.temp = clamp(b.temp + (Math.random() - 0.5) * 0.15, 25, 40);
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

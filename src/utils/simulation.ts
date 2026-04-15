import { INITIAL_FLEET } from '../data/fleet';
import type { Battery } from '../types';

/**
 * Simulate battery states at simulation hour h (0..24).
 * Each battery follows a deterministic cycle pattern, phased by id, so
 * different batteries are at different stages of swap/charge/supply cycles.
 */
export function simBatteries(h: number): Battery[] {
  h = ((h % 24) + 24) % 24;
  return INITIAL_FLEET.map((b) => simOne(b, h));
}

function simOne(base: Battery, h: number): Battery {
  const phase = ((base.id - 1) * 3.5) % 24;
  const t = (h - phase + 24) % 24;

  // 阶段区间（按相对小时）
  // 0–6h supplying (100→12), avg ~733 kW discharge
  // 6–6.25 swapping
  // 6.25–7 to_station
  // 7–10 charging (12→100), avg ~1467 kW charge
  // 10–10.75 to_platform
  // 10.75–14.25 standby
  // 14.25–14.5 swapping
  // 14.5–24 supplying (100→14), avg ~453 kW discharge
  const out: Battery = { ...base };
  const cap = base.capacity; // kWh
  if (t < 6) {
    out.st = 'supplying';
    out.soc = Math.max(10, 100 - (t / 6) * 88);
    // discharge power (kW) = 88% × capacity / 6h
    out.power = -((0.88 * cap) / 6);
  } else if (t < 6.25) {
    out.st = 'swapping';
    out.soc = 12;
    out.power = 0;
  } else if (t < 7) {
    out.st = 'to_station';
    out.soc = 10;
    out.tp = (t - 6.25) / 0.75;
    out.power = 0;
  } else if (t < 10) {
    out.st = 'charging';
    out.soc = 10 + ((t - 7) / 3) * 90;
    // charge power = 90% × capacity / 3h
    out.power = (0.9 * cap) / 3;
  } else if (t < 10.75) {
    out.st = 'to_platform';
    out.soc = 100;
    out.tp = (t - 10) / 0.75;
    out.power = 0;
  } else if (t < 14.25) {
    out.st = 'standby';
    out.soc = 100;
    out.power = 0;
  } else if (t < 14.5) {
    out.st = 'swapping';
    out.soc = 100;
    out.power = 0;
  } else {
    out.st = 'supplying';
    out.soc = Math.max(14, 100 - (t - 14.5) * 9);
    // discharge power = 86% × capacity / 9.5h
    out.power = -((0.86 * cap) / 9.5);
  }

  return out;
}

/** 汇总充电功率（正值 kW） */
export function totalChargingPower(batteries: Battery[]): number {
  return batteries.filter((b) => b.power > 0).reduce((a, b) => a + b.power, 0);
}

/** 汇总供电功率（正值 kW，取绝对值） */
export function totalSupplyingPower(batteries: Battery[]): number {
  return batteries.filter((b) => b.power < 0).reduce((a, b) => a - b.power, 0);
}

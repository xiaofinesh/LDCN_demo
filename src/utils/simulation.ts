import type { Battery } from '../types';

export function simBatteries(h: number): Battery[] {
  h = h % 24;
  const bs: Battery[] = [
    { id: 1, soc: 95, st: 'supplying', tp: 0 },
    { id: 2, soc: 80, st: 'standby', tp: 0 },
    { id: 3, soc: 60, st: 'charging', tp: 0 },
  ];
  // α-01
  if (h < 6) { bs[0].st = 'supplying'; bs[0].soc = Math.max(8, 95 - h * 14.5); }
  else if (h < 6.25) { bs[0].st = 'swapping'; bs[0].soc = 8; }
  else if (h < 7) { bs[0].st = 'to_station'; bs[0].soc = 7; bs[0].tp = (h - 6.25) / 0.75; }
  else if (h < 10) { bs[0].st = 'charging'; bs[0].soc = 7 + ((h - 7) / 3) * 93; }
  else if (h < 10.75) { bs[0].st = 'to_platform'; bs[0].soc = 100; bs[0].tp = (h - 10) / 0.75; }
  else if (h < 14.25) { bs[0].st = 'standby'; bs[0].soc = 100; }
  else if (h < 14.5) { bs[0].st = 'swapping'; bs[0].soc = 100; }
  else { bs[0].st = 'supplying'; bs[0].soc = Math.max(12, 100 - (h - 14.5) * 9.2); }
  // β-02
  if (h < 2.5) { bs[1].st = 'standby'; bs[1].soc = 80; }
  else if (h < 3.25) { bs[1].st = 'to_station'; bs[1].soc = 80; bs[1].tp = (h - 2.5) / 0.75; }
  else if (h < 5.75) { bs[1].st = 'charging'; bs[1].soc = 20 + ((h - 3.25) / 2.5) * 80; }
  else if (h < 6) { bs[1].st = 'to_platform'; bs[1].soc = 100; bs[1].tp = (h - 5.75) / 0.25; }
  else if (h < 6.25) { bs[1].st = 'swapping'; bs[1].soc = 100; }
  else if (h < 14.25) { bs[1].st = 'supplying'; bs[1].soc = Math.max(12, 100 - (h - 6.25) * 11); }
  else if (h < 14.5) { bs[1].st = 'swapping'; bs[1].soc = 14; }
  else if (h < 15.25) { bs[1].st = 'to_station'; bs[1].soc = 13; bs[1].tp = (h - 14.5) / 0.75; }
  else if (h < 18.25) { bs[1].st = 'charging'; bs[1].soc = 13 + ((h - 15.25) / 3) * 87; }
  else if (h < 19) { bs[1].st = 'to_platform'; bs[1].soc = 100; bs[1].tp = (h - 18.25) / 0.75; }
  else { bs[1].st = 'standby'; bs[1].soc = 100; }
  // γ-03
  if (h < 3) { bs[2].st = 'charging'; bs[2].soc = 60 + (h / 3) * 40; }
  else if (h < 3.75) { bs[2].st = 'to_platform'; bs[2].soc = 100; bs[2].tp = (h - 3) / 0.75; }
  else { bs[2].st = 'standby'; bs[2].soc = 100; }
  return bs;
}

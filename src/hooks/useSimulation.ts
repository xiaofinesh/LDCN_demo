import { useEffect, useRef, useState } from 'react';

export interface UseSimulationResult {
  simHour: number;
  setSimHour: React.Dispatch<React.SetStateAction<number>>;
  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
}

export function useSimulation(): UseSimulationResult {
  const [simHour, setSimHour] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const ref = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(
        () => setSimHour((p) => (p + 0.05 * speed) % 24),
        100,
      );
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running, speed]);

  return { simHour, setSimHour, running, setRunning, speed, setSpeed };
}

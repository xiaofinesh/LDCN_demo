import { useOutletContext } from 'react-router-dom';
import type { AppLayoutContext } from '../layouts/AppLayout';

export function useAppContext(): AppLayoutContext {
  return useOutletContext<AppLayoutContext>();
}

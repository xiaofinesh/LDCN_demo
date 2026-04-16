import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { C } from '../constants/tokens';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  show: (msg: string, kind?: ToastKind) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export const useToast = (): ToastCtx => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast outside provider');
  return v;
};

let _seq = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = _seq++;
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const ctx: ToastCtx = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  };

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 80,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} />
        ))}
      </div>
    </Ctx.Provider>
  );
};

const COLOR: Record<ToastKind, { bg: string; fg: string; border: string; icon: string }> = {
  success: { bg: C.accentLight, fg: C.accent, border: C.accent, icon: '✓' },
  error: { bg: C.redLight, fg: C.red, border: C.red, icon: '✕' },
  info: { bg: C.blueLight, fg: C.blue, border: C.blue, icon: 'i' },
};

const ToastView: React.FC<{ item: ToastItem }> = ({ item }) => {
  const c = COLOR[item.kind];
  const [show, setShow] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${c.border}40`,
        borderLeft: `3px solid ${c.fg}`,
        boxShadow: '0 4px 16px rgba(15,23,42,0.10)',
        borderRadius: 8,
        padding: '11px 14px 11px 12px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        maxWidth: 400,
        minWidth: 260,
        pointerEvents: 'auto',
        opacity: show ? 1 : 0,
        transform: show ? 'translateX(0)' : 'translateX(20px)',
        transition: 'opacity .25s, transform .25s',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: c.bg,
          color: c.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {c.icon}
      </div>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, flex: 1 }}>{item.message}</div>
    </div>
  );
};

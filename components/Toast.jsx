'use client';
import { useCallback, useRef, useState } from 'react';

export function useToast() {
  const [msg, setMsg] = useState('');
  const [on, setOn] = useState(false);
  const t = useRef();
  const show = useCallback((m) => {
    setMsg(m); setOn(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setOn(false), 2600);
  }, []);
  const node = <div className={`toast${on ? ' on' : ''}`} role="status" aria-live="polite">{msg}</div>;
  return [node, show];
}

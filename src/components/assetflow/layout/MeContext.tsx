"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Role } from '@/lib/auth/server';
import { getMe, type ClientMe } from '@/lib/auth/client';

export type Me = { id: string; email: string; role: Role; name?: string } | null;

type MeContextType = {
  me: Me;
  setMe: (next: Me) => void;
};

const MeContext = createContext<MeContextType | null>(null);

export function useMe(): MeContextType {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error('useMe must be used within MeProvider');
  return ctx;
}

export function MeProvider({ initialMe, children }: { initialMe: Me; children: React.ReactNode }) {
  const [me, setMe] = useState<Me>(initialMe ?? null);

  // Soft refresh on client to keep info up-to-date if SSR me missing or stale
  useEffect(() => {
    let cancelled = false;
    if (!me) {
      getMe().then((m: ClientMe) => {
        if (cancelled) return;
        if (m) setMe({ id: m.id, email: m.email, role: m.role || 'user', name: m.name });
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, []); // run once

  const value = useMemo(() => ({ me, setMe }), [me]);
  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

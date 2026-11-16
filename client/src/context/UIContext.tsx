import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckInModal } from '../components/CheckInModal';
import { useAuth } from './AuthContext';

interface UIValue {
  /** Open the "New check-in" form, optionally pre-selecting a group. */
  openCheckIn(groupId?: string | null): void;
}

const UIContext = createContext<UIValue>({ openCheckIn: () => {} });

export function UIProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [checkIn, setCheckIn] = useState<{ groupId?: string | null } | null>(null);
  const value = useMemo<UIValue>(() => ({ openCheckIn: (groupId) => setCheckIn({ groupId }) }), []);

  return (
    <UIContext.Provider value={value}>
      {children}
      {status === 'signedIn' && checkIn && (
        <CheckInModal initialGroupId={checkIn.groupId} onClose={() => setCheckIn(null)} />
      )}
    </UIContext.Provider>
  );
}

export function useUI(): UIValue {
  return useContext(UIContext);
}

/**
 * Shared wallet state for Control Room so LockView, WalletActionsPanel, and Page see the same locked/address/wallet.
 */

import { createContext, useContext, type ReactNode } from 'react';
import useSecureWallet from '../hooks/useSecureWallet';

export type ControlRoomWalletValue = ReturnType<typeof useSecureWallet>;

const ControlRoomWalletContext = createContext<ControlRoomWalletValue | null>(null);

export function ControlRoomWalletProvider({ children }: { children: ReactNode }) {
  const value = useSecureWallet();
  return (
    <ControlRoomWalletContext.Provider value={value}>
      {children}
    </ControlRoomWalletContext.Provider>
  );
}

/** Use shared wallet state when inside ControlRoomWalletProvider, otherwise per-component useSecureWallet. */
export function useControlRoomWallet(): ControlRoomWalletValue {
  const ctx = useContext(ControlRoomWalletContext);
  const fallback = useSecureWallet();
  return ctx !== null ? ctx : fallback;
}

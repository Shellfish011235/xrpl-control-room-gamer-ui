/**
 * Local saved XRPL destinations (payment recipients). Persisted in the browser only — not on-ledger.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isValidClassicAddress } from 'xrpl';

export interface XrplSavedContact {
  id: string;
  address: string;
  label: string;
  destinationTag?: number;
  lastUsedAt: number;
}

interface XrplAddressBookState {
  contacts: XrplSavedContact[];
}

interface XrplAddressBookActions {
  addOrUpdateContact: (input: { address: string; label?: string; destinationTag?: number }) => void;
  removeContact: (id: string) => void;
  recordUse: (address: string) => void;
}

const genId = () => Math.random().toString(36).slice(2, 14);

export const useXrplAddressBookStore = create<XrplAddressBookState & XrplAddressBookActions>()(
  persist(
    (set, get) => ({
      contacts: [],

      addOrUpdateContact: ({ address, label, destinationTag }) => {
        const a = address.trim();
        if (!isValidClassicAddress(a)) return;
        const now = Date.now();
        const list = get().contacts;
        const idx = list.findIndex((c) => c.address === a);
        const nextLabel = (label?.trim() || (idx >= 0 ? list[idx].label : '') || 'Saved').slice(0, 80);
        const tag =
          destinationTag !== undefined && Number.isFinite(destinationTag) && destinationTag >= 0
            ? Math.floor(destinationTag)
            : idx >= 0
              ? list[idx].destinationTag
              : undefined;
        const entry: XrplSavedContact = {
          id: idx >= 0 ? list[idx].id : genId(),
          address: a,
          label: nextLabel,
          destinationTag: tag,
          lastUsedAt: now,
        };
        if (idx >= 0) {
          const copy = [...list];
          copy[idx] = entry;
          set({ contacts: copy });
        } else {
          set({ contacts: [entry, ...list].slice(0, 200) });
        }
      },

      removeContact: (id) => set({ contacts: get().contacts.filter((c) => c.id !== id) }),

      recordUse: (address) => {
        const a = address.trim();
        if (!a) return;
        const now = Date.now();
        set({
          contacts: get().contacts.map((c) => (c.address === a ? { ...c, lastUsedAt: now } : c)),
        });
      },
    }),
    { name: 'xrpl-address-book-v1' }
  )
);

/** Most recently used first */
export function useXrplAddressBookSorted(): XrplSavedContact[] {
  return useXrplAddressBookStore((s) => [...s.contacts].sort((a, b) => b.lastUsedAt - a.lastUsedAt));
}

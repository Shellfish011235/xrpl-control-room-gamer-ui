/**
 * Task Receipt log — local persistence only. No on-ledger write, no XRPL memos, no transaction submission.
 *
 * `receiptHash` / sub-hashes are local display fingerprints from taskReceiptEngine — not HSM or blockchain attestation.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreateTaskReceiptInput, TaskReceipt } from '../receipts/taskReceiptTypes';
import { createTaskReceipt } from '../receipts/taskReceiptEngine';

export interface TaskReceiptState {
  receipts: TaskReceipt[];
  selectedReceiptId: string | null;
}

export interface TaskReceiptActions {
  addReceipt: (r: TaskReceipt) => void;
  clearReceipts: () => void;
  selectReceipt: (id: string | null) => void;
  getSelectedReceipt: () => TaskReceipt | null;
  addManualReceipt: (input: CreateTaskReceiptInput) => void;
}

const initial: TaskReceiptState = {
  receipts: [],
  selectedReceiptId: null,
};

export const useTaskReceiptStore = create<TaskReceiptState & TaskReceiptActions>()(
  persist(
    (set, get) => ({
      ...initial,

      addReceipt: (r) =>
        set((s) => ({
          receipts: [r, ...s.receipts].slice(0, 300),
        })),

      clearReceipts: () => set({ receipts: [], selectedReceiptId: null }),

      selectReceipt: (id) => set({ selectedReceiptId: id }),

      getSelectedReceipt: () => {
        const s = get();
        if (!s.selectedReceiptId) {
          return null;
        }
        return s.receipts.find((r) => r.id === s.selectedReceiptId) ?? null;
      },

      addManualReceipt: (input) => {
        const r = createTaskReceipt(input);
        get().addReceipt(r);
      },
    }),
    { name: 'xrpl-task-receipts-v0-1' }
  )
);

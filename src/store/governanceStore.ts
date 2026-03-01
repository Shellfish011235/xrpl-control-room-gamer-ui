/**
 * Governance state — validator-friendly tracking (read-only, no voting).
 * Aligns with XRPL Governance Companion: mark amendments as reviewed, optional validator context.
 * All data is local (localStorage); no private keys, no automated voting.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'xrpl-governance';

interface GovernanceState {
  /** Amendment IDs (or names) the user has marked as "reviewed" — local only */
  reviewedAmendmentIds: string[];
  /** Optional validator public key for "your validator" context (e.g. link to XRPScan). Not used for voting. */
  validatorPublicKey: string | null;
  markReviewed: (amendmentId: string) => void;
  unmarkReviewed: (amendmentId: string) => void;
  isReviewed: (amendmentId: string) => boolean;
  setValidatorPublicKey: (key: string | null) => void;
  clearReviewed: () => void;
}

export const useGovernanceStore = create<GovernanceState>()(
  persist(
    (set, get) => ({
      reviewedAmendmentIds: [],
      validatorPublicKey: null,
      markReviewed: (amendmentId) =>
        set((s) => ({
          reviewedAmendmentIds: s.reviewedAmendmentIds.includes(amendmentId)
            ? s.reviewedAmendmentIds
            : [...s.reviewedAmendmentIds, amendmentId],
        })),
      unmarkReviewed: (amendmentId) =>
        set((s) => ({
          reviewedAmendmentIds: s.reviewedAmendmentIds.filter((id) => id !== amendmentId),
        })),
      isReviewed: (amendmentId) => get().reviewedAmendmentIds.includes(amendmentId),
      setValidatorPublicKey: (key) => set({ validatorPublicKey: key || null }),
      clearReviewed: () => set({ reviewedAmendmentIds: [] }),
    }),
    { name: STORAGE_KEY }
  )
);

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProvenanceRecord } from '../../types/operating';
import { useOperatingMode } from '../../systems/modes/modeStore';

/**
 * Expandable line-level provenance. Attach to a card or block.
 * Future: fetch tx hash / attestation from provenance service when backend exists.
 */
export function ProvenanceDrawer({ open, onClose, record, contentKind }: { open: boolean; onClose: () => void; record: ProvenanceRecord; contentKind: 'observation' | 'claim' }) {
  const op = useOperatingMode();
  return (
    <AnimatePresence>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-[100] bg-black/50 lg:bg-transparent" aria-label="Close" onClick={onClose} />
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed top-0 right-0 z-[110] w-[min(100%,360px)] h-full border-l border-cyber-border bg-cyber-darker shadow-2xl p-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-cyber text-cyber-glow">Provenance</h2>
              <button type="button" onClick={onClose} className="p-1 rounded text-cyber-muted hover:text-cyber-text" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <dl className="space-y-2 text-xs font-cyber text-cyber-muted">
              <div>
                <dt className="text-cyber-text/80">Content</dt>
                <dd className="text-cyber-text">{contentKind === 'observation' ? 'Observation' : 'Claim / interpretation'}</dd>
              </div>
              <div>
                <dt className="text-cyber-text/80">Source</dt>
                <dd>{record.label}</dd>
              </div>
              {record.fetchedAt && (
                <div>
                  <dt className="text-cyber-text/80">Fetched</dt>
                  <dd>{record.fetchedAt}</dd>
                </div>
              )}
              {record.schemaVersion && op.isOperator() && (
                <div>
                  <dt className="text-cyber-text/80">Schema / version</dt>
                  <dd className="font-mono text-[10px]">{record.schemaVersion}</dd>
                </div>
              )}
              {record.nodeOrigin && op.isOperator() && (
                <div>
                  <dt className="text-cyber-text/80">Node / API</dt>
                  <dd className="font-mono text-[10px] break-all">{record.nodeOrigin}</dd>
                </div>
              )}
              {record.confidence != null && (
                <div>
                  <dt className="text-cyber-text/80">Confidence</dt>
                  <dd>{(record.confidence * 100).toFixed(0)}%</dd>
                </div>
              )}
              {record.stale && <p className="text-cyber-yellow text-[10px]">Stale — re-fetch recommended.</p>}
              {record.note && <p className="text-[10px] text-cyber-muted pt-2 border-t border-cyber-border">{record.note}</p>}
            </dl>
            <p className="mt-4 text-[9px] text-cyber-muted/80">
              This panel describes where information came from. It is not a warrant of accuracy, fitness, or regulatory status of any asset.
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Mint form – URI, taxon, flags. Builds NFTokenMint payload; parent wires Xaman.
 * Includes safety: URI validation, anti-snipe warnings, no HTTP / raw JSON.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { buildNFTokenMintPayload, validateMintUri } from '../../services/nftService';

const MAX_URI_BYTES = 256;

interface NFTMintFormProps {
  account: string;
  onSubmit: (payload: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

export function NFTMintForm({ account, onSubmit, isSubmitting }: NFTMintFormProps) {
  const [uri, setUri] = useState('');
  const [taxon, setTaxon] = useState(0);
  const [transferFee, setTransferFee] = useState<number | ''>('');

  const uriValidation = useMemo(() => validateMintUri(uri), [uri]);
  const canSubmit = uriValidation.ok && !isSubmitting && !!account;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uriValidation.ok) return;
    const payload = buildNFTokenMintPayload({
      account,
      uri: uri.trim(),
      taxon,
      transferFee: transferFee === '' ? undefined : Number(transferFee),
    });
    onSubmit(payload);
  };

  return (
    <div className="space-y-4">
      {/* Safety – anti-snipe and metadata best practices (opaque for legibility) */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-cyber-yellow/50 bg-cyber-darker p-4 shadow-lg"
      >
        <div className="flex items-start gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-cyber-yellow shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-cyber text-cyber-yellow uppercase tracking-wider">Stay safe · avoid sniping</h4>
            <ul className="text-[11px] text-cyber-text mt-1.5 space-y-1 list-disc list-inside opacity-95">
              <li>Host metadata on <strong className="text-cyber-yellow/90">your own server or IPFS</strong>. Don’t paste raw JSON—it can be copied and minted by others first.</li>
              <li>Use <strong className="text-cyber-yellow/90">HTTPS only</strong> (no HTTP). Insecure URLs can be scraped or altered by bots.</li>
              <li>Publish the metadata URL only when you’re ready to mint, then mint immediately.</li>
              <li>Public paste sites (Pastebin, etc.) are high risk—anyone with the link can snipe.</li>
            </ul>
          </div>
        </div>
      </motion.div>

    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="p-6 rounded-lg border border-cyber-border space-y-4 bg-cyber-darker shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-cyber-glow" />
        <h3 className="font-cyber text-cyber-text">MINT NFT (XLS-20)</h3>
        <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40">
          BETA · Testnet
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-cyber-muted">URI (metadata URL – HTTPS or IPFS only)</label>
          {uri.trim().length > 0 && (
            <span className={`text-[10px] ${new TextEncoder().encode(uri).length > MAX_URI_BYTES ? 'text-cyber-red' : 'text-cyber-muted'}`}>
              {new TextEncoder().encode(uri).length} / {MAX_URI_BYTES} bytes
            </span>
          )}
        </div>
        <input
          type="text"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          placeholder="https://... or ipfs://..."
          className={`w-full bg-cyber-darker border rounded px-3 py-2 text-cyber-text text-sm placeholder-cyber-muted ${
            uriValidation.error ? 'border-cyber-red/50' : uriValidation.warning ? 'border-cyber-yellow/50' : 'border-cyber-border'
          }`}
        />
        {uriValidation.error && (
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-cyber-red">
            <AlertTriangle size={12} />
            {uriValidation.error}
          </div>
        )}
        {uriValidation.warning && !uriValidation.error && (
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-cyber-yellow">
            <Info size={12} />
            {uriValidation.warning}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs text-cyber-muted mb-1">Taxon (collection id, 0–4294967295)</label>
        <input
          type="number"
          min={0}
          max={4294967295}
          value={taxon}
          onChange={(e) => setTaxon(Number(e.target.value) || 0)}
          className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-cyber-text text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-cyber-muted mb-1">Transfer fee % (0–50000, basis points)</label>
        <input
          type="number"
          min={0}
          max={50000}
          value={transferFee}
          onChange={(e) => setTransferFee(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="0"
          className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-cyber-text text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 rounded-lg border border-cyber-glow/50 text-cyber-glow font-cyber hover:bg-cyber-glow/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Preparing…' : uriValidation.ok ? 'Mint NFT (sign in Xaman)' : 'Fix URI to continue'}
      </button>
    </motion.form>
    </div>
  );
}

/**
 * Lock screen: unlock/import only + tagline + testnet warning.
 * Shown when Control Room wallet is locked; everything else hidden until unlock.
 */

import { useState } from 'react';
import { useControlRoomWallet } from '../context/ControlRoomWalletContext';

export default function ControlRoomLockView() {
  const { hasSavedSeed, error, unlock, saveSeed } = useControlRoomWallet();
  const [pw, setPw] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [importStatus, setImportStatus] = useState('');

  async function doUnlock() {
    setImportStatus('');
    const ok = await unlock(pw);
    if (ok) setPw('');
  }

  async function importAndSaveSeed() {
    setImportStatus('');
    if (!seedInput.trim()) return;
    if (!pw.trim()) {
      setImportStatus('Set a password first (used to encrypt your seed locally).');
      return;
    }
    try {
      await saveSeed(seedInput.trim(), pw);
      setSeedInput('');
      setPw('');
    } catch (e: unknown) {
      setImportStatus(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 neon-panel">
      <h2 className="text-2xl font-cyber text-cyber-glow mb-6 neon-glow">
        Unlock Control Room Wallet
      </h2>

      {/* Unlock (if saved seed) */}
      <div className="mb-4">
        <label className="text-xs text-cyber-muted mb-2 block">Unlock (if you already saved a seed)</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password"
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--cyber-dark)] border border-[var(--cyber-border)] text-[var(--theme-text)] placeholder:text-cyber-muted text-sm"
          />
          <button
            type="button"
            onClick={doUnlock}
            disabled={!hasSavedSeed || !pw.trim()}
            className="neon-button disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Unlock
          </button>
        </div>
        {!hasSavedSeed && (
          <p className="text-xs text-cyber-yellow mt-2">No saved wallet yet. Import a seed below.</p>
        )}
      </div>

      {/* Import seed + encrypt */}
      <div className="mb-4">
        <label className="text-xs text-cyber-muted mb-2 block">Import seed + encrypt locally</label>
        <div className="grid gap-2">
          <input
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            placeholder="Seed (s....) — paste carefully"
            className="px-3 py-2 rounded-xl bg-[var(--cyber-dark)] border border-[var(--cyber-border)] text-[var(--theme-text)] placeholder:text-cyber-muted text-sm font-mono"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Set password to encrypt seed"
            className="px-3 py-2 rounded-xl bg-[var(--cyber-dark)] border border-[var(--cyber-border)] text-[var(--theme-text)] placeholder:text-cyber-muted text-sm"
          />
          <button
            type="button"
            onClick={importAndSaveSeed}
            disabled={!seedInput.trim() || !pw.trim()}
            className="px-4 py-2 rounded-xl border border-[var(--color-confirm)] text-[var(--color-confirm)] hover:bg-[var(--color-confirm)]/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
          >
            Import seed + encrypt
          </button>
          {(importStatus || error) && (
            <p className="text-xs text-cyber-muted">{importStatus || error}</p>
          )}
        </div>
      </div>

      <p className="text-cyber-yellow text-sm mt-4">
        ⚠️ Testnet mode active. In-browser signing is high-risk for mainnet funds.
      </p>
    </div>
  );
}

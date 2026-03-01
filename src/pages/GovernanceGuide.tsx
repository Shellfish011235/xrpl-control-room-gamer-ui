/**
 * In-app governance guide (FAQ, links). Linked from Ledger Impact tool.
 */

import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink, FileText } from 'lucide-react';

export default function GovernanceGuide() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/terminal"
            className="flex items-center gap-2 px-3 py-2 rounded border border-cyber-border text-cyber-text hover:bg-cyber-darker text-sm"
          >
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back
          </Link>
        </div>
        <div className="rounded-lg border border-cyber-border bg-cyber-darker/50 p-6 space-y-6 text-cyber-text font-sans">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-cyber-glow" />
            <h1 className="text-lg font-cyber text-cyber-glow">XRPL Governance Guide</h1>
          </div>
          <p className="text-sm text-cyber-muted leading-relaxed">
            A short FAQ for validators and operators using the Ledger Impact / governance tools.
          </p>

          <section>
            <h2 className="text-sm font-semibold text-cyber-cyan mb-2">What are amendments?</h2>
            <p className="text-sm text-cyber-muted leading-relaxed">
              Amendments are protocol-level changes to the XRPL. They are voted on by validators and, once enabled, apply to the entire network. See{' '}
              <a href="https://xrpl.org/amendments.html" target="_blank" rel="noopener noreferrer" className="text-cyber-glow inline-flex items-center gap-1">
                XRPL Amendments <ExternalLink size={12} />
              </a>{' '}
              for the official overview.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-cyber-cyan mb-2">How does voting work?</h2>
            <p className="text-sm text-cyber-muted leading-relaxed">
              Validators signal support by including amendment IDs in their validation messages. When 80% of the UNL validators support an amendment, it enters a 2-week waiting period. After that, the amendment is enabled. There is no “vote” transaction; support is inferred from validator configuration and published manifests.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-cyber-cyan mb-2">Where can I see live amendment status?</h2>
            <ul className="text-sm text-cyber-muted space-y-1 list-disc list-inside">
              <li>
                <a href="https://xrpscan.com/amendments" target="_blank" rel="noopener noreferrer" className="text-cyber-glow">XRPScan – amendments</a> — vote counts, majority status, activation dates.
              </li>
              <li>If you set your validator public key in this app, use “View validator on XRPScan” in the Ledger Impact tool to see your validator’s status.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-cyber-cyan mb-2">What does “Mark as reviewed” do?</h2>
            <p className="text-sm text-cyber-muted leading-relaxed">
              It is local only. It records that you have reviewed that amendment in this app. It does not submit any vote or transaction. Use it to track your own workflow and to filter the “Needs review” list.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-cyber-cyan mb-2">Who benefits from an amendment?</h2>
            <p className="text-sm text-cyber-muted leading-relaxed">
              The “Who this helps” text on some amendments is a short, plain-English summary of which users or use cases benefit. It is for context only, not a recommendation.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-cyber-cyan mb-2">Where can I learn more?</h2>
            <ul className="text-sm text-cyber-muted space-y-1">
              <li><a href="https://xrpl.org/amendments.html" target="_blank" rel="noopener noreferrer" className="text-cyber-glow">xrpl.org – Amendments</a></li>
              <li><a href="https://xrpscan.com/amendments" target="_blank" rel="noopener noreferrer" className="text-cyber-glow">XRPScan – Amendments</a></li>
              <li><a href="https://xrpl.org/docs.html" target="_blank" rel="noopener noreferrer" className="text-cyber-glow">XRPL Dev Portal</a></li>
              <li>Your validator software docs (e.g. rippled, validator setup guides)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-cyber-cyan mb-2">Privacy</h2>
            <p className="text-sm text-cyber-muted leading-relaxed">
              All “reviewed” state and optional validator key are stored only in your browser. Nothing is sent to a backend for governance tracking.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

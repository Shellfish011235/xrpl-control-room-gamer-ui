/**
 * Phase 0 compliance framing: "Software + information layer" — not a broker, adviser,
 * exchange, or custodian. Durable for U.S. / Florida orientation; not a substitute for counsel.
 */

export function SiteLegalFooter() {
  return (
    <footer
      className="relative z-10 border-t border-cyber-border/60 bg-cyber-darker/90 backdrop-blur-sm"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <p className="text-[10px] sm:text-xs text-cyber-muted font-cyber leading-relaxed tracking-wide">
          <strong className="text-cyber-text/90 font-semibold not-italic">XRPL Control Room</strong>
          {` is software for analytics, blockchain information, and educational tooling. Content is for `}
          <strong className="text-cyber-text/80">informational purposes only</strong>
          {` — not investment, legal, or tax advice, and not an offer to buy or sell any asset.`}
        </p>
        <ul className="mt-3 space-y-1.5 text-[9px] sm:text-[10px] text-cyber-muted/95 font-cyber leading-relaxed list-disc pl-4 marker:text-cyber-glow/50">
          <li>
            <span className="text-cyber-text/80">Risk:</span> Digital assets involve significant risk, volatility, and
            possible loss. Past or network data is not a prediction of future results.
          </li>
          <li>
            <span className="text-cyber-text/80">Wallets &amp; signing:</span> We do not take custody of user funds or
            private keys. Transactions and signatures require your explicit action in your own wallet (e.g. Xaman) or
            your chosen provider.
          </li>
          <li>
            <span className="text-cyber-text/80">Not our role:</span> This site is not a broker, investment adviser,
            money transmitter, securities exchange, or custodian. It does not pool user assets or manage portfolios for
            others.
          </li>
        </ul>
        <p className="mt-3 text-[9px] text-cyber-muted/80 font-cyber leading-relaxed">
          If you are in the U.S. (including Florida), you are responsible for your own compliance with applicable laws
          and regulations. Features involving AI, routing, or automation require clear user control and are offered as
          tools, not as fiduciary or investment services.
        </p>
      </div>
    </footer>
  );
}

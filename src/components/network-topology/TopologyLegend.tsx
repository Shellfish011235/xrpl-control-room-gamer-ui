export function TopologyLegend() {
  return (
    <div className="rounded-xl border border-cyber-border/50 bg-cyber-darker/60 p-3 text-[11px] text-cyber-muted">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <span><span className="mr-1 text-cyber-green">●</span> Observed: directly supported by current source data</span>
        <span><span className="mr-1 text-cyber-yellow">◌</span> Inferred: analytical relationship, not direct observation</span>
        <span><span className="mr-1 text-cyber-muted">○</span> Unknown: public evidence stops here</span>
      </div>
      <p className="mt-2 leading-relaxed">
        Opaque or unknown infrastructure is a visibility boundary. It does not by itself identify an institution, sentry relationship, or hidden routing path.
      </p>
    </div>
  )
}

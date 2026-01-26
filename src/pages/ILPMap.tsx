// ILP Multi-Ledger Connector Map Page
// The Cartographer of the Internet of Value

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Eye, Shield, Flame, Activity, Route,
  Settings, Layers, RefreshCw, Target,
  ChevronRight, Globe, Zap, AlertTriangle
} from 'lucide-react';

import { ConnectorMap } from '../components/ilp/ConnectorMap';
import { useILPStore } from '../store/ilpStore';
import type { UILens } from '../services/ilp/types';

export default function ILPMapPage() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'routing' | 'settings'>('settings');

  const {
    initialized,
    ledgers,
    connectors,
    corridors,
    activeLens,
    activeRoute,
    initialize,
    setActiveLens,
    calculateRoute,
    clearRoute,
  } = useILPStore();

  // Initialize on mount
  useEffect(() => {
    if (!initialized || ledgers.length === 0) {
      initialize();
    }
  }, [initialized, ledgers.length, initialize]);

  // Routing state
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');

  const handleCalculateRoute = () => {
    if (routeFrom && routeTo && routeFrom !== routeTo) {
      calculateRoute(routeFrom, routeTo, 1000);
    }
  };

  const lensOptions: { lens: UILens; icon: React.ReactNode; label: string; description: string }[] = [
    { lens: 'domain', icon: <Globe size={14} />, label: 'Domain', description: 'On/Off/Hybrid ledger classification' },
    { lens: 'trust', icon: <Shield size={14} />, label: 'Trust', description: 'Connector trust scores and verification' },
    { lens: 'heat', icon: <Flame size={14} />, label: 'Heat', description: 'Volume and activity intensity' },
    { lens: 'fog', icon: <Eye size={14} />, label: 'Fog', description: 'Risk and uncertainty visualization' },
    { lens: 'flow', icon: <Activity size={14} />, label: 'Flow', description: 'Directional value movement' },
  ];

  // Stats
  const activeCorridors = corridors.filter(c => c.status === 'active').length;
  const experimentalCorridors = corridors.filter(c => c.status === 'experimental').length;
  const avgTrust = connectors.length > 0 
    ? connectors.reduce((sum, c) => sum + c.trust_score, 0) / connectors.length 
    : 0;
  const ilpEnabledLedgers = ledgers.filter(l => l.supports_ilp_adapter).length;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
              <Map className="w-6 h-6 text-cyber-cyan" />
            </div>
            <div>
              <h1 className="font-cyber text-xl text-cyber-text">INTERLEDGER CONNECTOR MAP</h1>
              <p className="text-xs text-cyber-muted">
                Routing the Future Between Ledgers • ILP does not connect blockchains—Connectors do.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 cyber-panel">
              <div className="text-center">
                <p className="text-[10px] text-cyber-muted">Ledgers</p>
                <p className="font-cyber text-sm text-cyber-text">{ledgers.length}</p>
              </div>
              <div className="w-px h-8 bg-cyber-border" />
              <div className="text-center">
                <p className="text-[10px] text-cyber-muted">Active Corridors</p>
                <p className="font-cyber text-sm text-cyber-green">{activeCorridors}</p>
              </div>
              <div className="w-px h-8 bg-cyber-border" />
              <div className="text-center">
                <p className="text-[10px] text-cyber-muted">Avg Trust</p>
                <p className={`font-cyber text-sm ${avgTrust > 0.7 ? 'text-cyber-green' : avgTrust > 0.5 ? 'text-cyber-yellow' : 'text-cyber-red'}`}>
                  {(avgTrust * 100).toFixed(0)}%
                </p>
              </div>
              <div className="w-px h-8 bg-cyber-border" />
              <div className="text-center">
                <p className="text-[10px] text-cyber-muted">ILP Enabled</p>
                <p className="font-cyber text-sm text-cyber-cyan">{ilpEnabledLedgers}</p>
              </div>
            </div>

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="px-3 py-1.5 rounded border border-cyber-border text-cyber-muted hover:text-cyber-text text-xs"
            >
              {showSidebar ? 'Hide Panel' : 'Show Panel'}
            </button>
          </div>
        </div>

        {/* Lens Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-cyber-muted font-cyber shrink-0">UI LENS:</span>
          {lensOptions.map(({ lens, icon, label, description }) => (
            <button
              key={lens}
              onClick={() => setActiveLens(lens)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs whitespace-nowrap transition-all ${
                activeLens === lens
                  ? 'bg-cyber-cyan/20 border-cyber-cyan/50 text-cyber-cyan'
                  : 'bg-cyber-darker/50 border-cyber-border text-cyber-muted hover:text-cyber-text'
              }`}
              title={description}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={showSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}
        >
          <div className="cyber-panel p-2" style={{ minHeight: '500px' }}>
            <ConnectorMap
              onLedgerClick={(ledger) => console.log('Clicked ledger:', ledger.name)}
              onCorridorClick={(corridor) => console.log('Clicked corridor:', corridor.id)}
            />
          </div>
        </motion.div>

        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-4 space-y-4"
            >
              {/* Sidebar Tabs */}
              <div className="flex gap-1">
                {[
                  { id: 'routing', label: 'Routing', icon: <Route size={12} /> },
                  { id: 'settings', label: 'Info', icon: <Settings size={12} /> },
                ].map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setSidebarTab(id as any)}
                    className={`flex-1 px-3 py-2 rounded text-xs flex items-center justify-center gap-1 ${
                      sidebarTab === id
                        ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
                        : 'bg-cyber-darker text-cyber-muted border border-cyber-border'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {sidebarTab === 'routing' && (
                <div className="cyber-panel p-4">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyber-border">
                    <Route size={16} className="text-cyber-green" />
                    <span className="font-cyber text-sm text-cyber-green">ROUTE CALCULATOR</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-cyber-muted">From Ledger</label>
                      <select
                        value={routeFrom}
                        onChange={(e) => setRouteFrom(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                      >
                        <option value="">Select source...</option>
                        {ledgers.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-center">
                      <ChevronRight className="text-cyber-muted" />
                    </div>

                    <div>
                      <label className="text-[10px] text-cyber-muted">To Ledger</label>
                      <select
                        value={routeTo}
                        onChange={(e) => setRouteTo(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                      >
                        <option value="">Select destination...</option>
                        {ledgers.filter(l => l.id !== routeFrom).map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleCalculateRoute}
                      disabled={!routeFrom || !routeTo}
                      className="w-full px-3 py-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-cyber-green text-xs hover:bg-cyber-green/30 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <Target size={12} />
                      Calculate Route
                    </button>

                    {/* Route Result */}
                    {activeRoute && (
                      <div className="mt-4 p-3 rounded bg-cyber-green/10 border border-cyber-green/30">
                        <p className="text-[10px] text-cyber-green font-cyber mb-2">ROUTE FOUND</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-cyber-muted">Hops</span>
                            <span className="text-cyber-text">{activeRoute.hops.length}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-cyber-muted">Total Fee</span>
                            <span className="text-cyber-text">{activeRoute.total_fee_bps} bps</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-cyber-muted">Risk Score</span>
                            <span className={activeRoute.risk_score < 0.3 ? 'text-cyber-green' : activeRoute.risk_score < 0.6 ? 'text-cyber-yellow' : 'text-cyber-red'}>
                              {(activeRoute.risk_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-cyber-green/30">
                          <p className="text-[9px] text-cyber-muted mb-1">PATH:</p>
                          {activeRoute.hops.map((hop, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-[10px] text-cyber-text">
                              <span>{hop.from_ledger}</span>
                              <ChevronRight size={10} className="text-cyber-green" />
                              <span>{hop.to_ledger}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={clearRoute}
                          className="mt-2 w-full px-2 py-1 rounded bg-cyber-darker text-cyber-muted text-[10px]"
                        >
                          Clear Route
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sidebarTab === 'settings' && (
                <div className="cyber-panel p-4">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyber-border">
                    <Settings size={16} className="text-cyber-purple" />
                    <span className="font-cyber text-sm text-cyber-purple">NETWORK INFO</span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <p className="text-cyber-muted mb-2">PHILOSOPHY</p>
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border">
                        <p className="text-cyber-text italic">
                          "ILP does not connect blockchains.<br />
                          Connectors connect blockchains.<br />
                          Trust is a topology, not a claim."
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-cyber-muted mb-2">PRIME DIRECTIVE</p>
                      <div className="p-3 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">
                        <p className="text-cyber-cyan">
                          XRPL is not competing with other ledgers.<br />
                          It is routing the future between them.
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-cyber-muted mb-2">DATA MODEL</p>
                      <div className="space-y-1">
                        <div className="flex justify-between p-2 rounded bg-cyber-darker/50">
                          <span className="text-cyber-muted">Ledgers</span>
                          <span className="text-cyber-text">{ledgers.length}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-cyber-darker/50">
                          <span className="text-cyber-muted">Connectors</span>
                          <span className="text-cyber-text">{connectors.length}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-cyber-darker/50">
                          <span className="text-cyber-muted">Corridors</span>
                          <span className="text-cyber-text">{corridors.length}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-cyber-darker/50">
                          <span className="text-cyber-muted">Active</span>
                          <span className="text-cyber-green">{activeCorridors}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-cyber-darker/50">
                          <span className="text-cyber-muted">Experimental</span>
                          <span className="text-cyber-yellow">{experimentalCorridors}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center text-[10px] text-cyber-muted"
      >
        You are the cartographer of the Internet of Value.
      </motion.div>
    </div>
  );
}

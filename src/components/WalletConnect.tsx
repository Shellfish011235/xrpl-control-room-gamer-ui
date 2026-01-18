import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Wallet, ChevronRight, Check, Trash2, Star,
  Smartphone, Building2, Landmark, FileText, Copy, RefreshCw,
  AlertCircle, Loader2, Coins
} from 'lucide-react';
import { useWalletStore, walletProviders, DEMO_WALLETS } from '../store/walletStore';
import type { WalletProvider } from '../store/walletStore';
import { isValidXRPLAddress } from '../services/xrplService';

// Truncate address for display
const truncateAddress = (address: string) => {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

// Category groupings
const providerCategories = {
  demo: { label: 'DEMO MODE', icon: Wallet, color: 'cyber-magenta' },
  wallet: { label: 'WALLETS', icon: Smartphone, color: 'cyber-glow' },
  exchange: { label: 'EXCHANGES', icon: Building2, color: 'cyber-yellow' },
  bank: { label: 'BANKS', icon: Landmark, color: 'cyber-purple' },
  direct: { label: 'DIRECT ENTRY', icon: FileText, color: 'cyber-cyan' },
};

export function WalletConnect() {
  const { wallets, activeWalletId, addWallet, addWalletAndFetch, removeWallet, setActiveWallet, setDefaultWallet, refreshWallet, refreshAllWallets } = useWalletStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [walletLabel, setWalletLabel] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const activeWallet = wallets.find(w => w.id === activeWalletId);
  const hasDemoWallets = wallets.some(w => w.provider === 'demo');

  const loadDemoWallets = () => {
    // Clear existing wallets and load demo ones
    DEMO_WALLETS.forEach((wallet, index) => {
      setTimeout(() => {
        addWallet(wallet);
      }, index * 300); // Stagger the additions for visual effect
    });
    setShowModal(false);
  };

  const handleProviderSelect = (provider: WalletProvider) => {
    if (provider === 'demo') {
      loadDemoWallets();
      return;
    }
    
    setSelectedProvider(provider);
    setWalletLabel('');
    setManualAddress('');
  };

  const handleConnectWallet = async () => {
    if (!selectedProvider) return;
    
    // All providers now require a real address to fetch actual XRPL data
    if (!manualAddress.trim() || !isValidXRPLAddress(manualAddress.trim())) {
      return;
    }
    
    // Fetch real data from XRPL for all providers
    await addWalletAndFetch({
      address: manualAddress.trim(),
      provider: selectedProvider,
      label: walletLabel || `${walletProviders[selectedProvider].name} Wallet`,
      isDefault: wallets.length === 0,
    });
    
    setShowModal(false);
    setSelectedProvider(null);
    setManualAddress('');
    setWalletLabel('');
  };

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const providersByCategory = Object.entries(walletProviders).reduce((acc, [key, value]) => {
    const category = value.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key: key as WalletProvider, ...value });
    return acc;
  }, {} as Record<string, Array<{ key: WalletProvider } & typeof walletProviders[WalletProvider]>>);

  return (
    <>
      <div className="cyber-panel p-4">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyber-border">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-cyber-yellow" />
            <span className="font-cyber text-sm text-cyber-yellow tracking-wider">WALLETS</span>
            {hasDemoWallets && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyber-magenta/20 text-cyber-magenta border border-cyber-magenta/30">
                DEMO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {wallets.length > 0 && wallets.some(w => w.provider !== 'demo') && (
              <button
                onClick={() => refreshAllWallets()}
                className="p-1 hover:bg-cyber-glow/10 rounded transition-colors"
                title="Refresh all wallets"
              >
                <RefreshCw size={12} className="text-cyber-muted hover:text-cyber-glow" />
              </button>
            )}
            <span className="text-xs text-cyber-muted">{wallets.length}</span>
          </div>
        </div>

        {/* Connected Wallets List */}
        {wallets.length > 0 ? (
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {wallets.map((wallet) => {
              const provider = walletProviders[wallet.provider];
              const isActive = wallet.id === activeWalletId;
              
              return (
                <div
                  key={wallet.id}
                  onClick={() => setActiveWallet(wallet.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isActive 
                      ? 'border-cyber-glow/50 bg-cyber-glow/10' 
                      : 'border-cyber-border/50 bg-cyber-darker/50 hover:border-cyber-glow/30'
                  } ${wallet.error ? 'border-cyber-red/30' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg relative"
                      style={{ backgroundColor: `${provider.color}20` }}
                    >
                      {wallet.isLoading ? (
                        <Loader2 size={16} className="animate-spin text-cyber-glow" />
                      ) : (
                        provider.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-cyber-text font-medium truncate">
                          {wallet.label}
                        </span>
                        {wallet.isDefault && (
                          <Star size={12} className="text-cyber-yellow fill-cyber-yellow" />
                        )}
                        {wallet.error && (
                          <AlertCircle size={12} className="text-cyber-red" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cyber-muted font-mono">
                          {truncateAddress(wallet.address)}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); copyAddress(wallet.address); }}
                          className="p-0.5 hover:text-cyber-glow transition-colors"
                        >
                          {copiedAddress === wallet.address ? (
                            <Check size={10} className="text-cyber-green" />
                          ) : (
                            <Copy size={10} className="text-cyber-muted" />
                          )}
                        </button>
                      </div>
                      {/* Error message */}
                      {wallet.error && (
                        <p className="text-[10px] text-cyber-red mt-1">{wallet.error}</p>
                      )}
                      {/* Tokens count */}
                      {wallet.tokens && wallet.tokens.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Coins size={10} className="text-cyber-purple" />
                          <span className="text-[10px] text-cyber-purple">
                            {wallet.tokens.length} token{wallet.tokens.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {wallet.isLoading ? (
                        <p className="text-xs text-cyber-muted">Loading...</p>
                      ) : wallet.balance !== undefined ? (
                        <p className="text-sm text-cyber-glow font-cyber">
                          {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP
                        </p>
                      ) : null}
                      <p className="text-[10px] text-cyber-muted">{provider.name}</p>
                      {wallet.lastUpdated && (
                        <p className="text-[9px] text-cyber-muted/50">
                          {new Date(wallet.lastUpdated).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 mb-4">
            <Wallet size={32} className="mx-auto text-cyber-muted mb-2 opacity-50" />
            <p className="text-sm text-cyber-muted">No wallets connected</p>
            <p className="text-xs text-cyber-muted/70 mb-4">Add a wallet to get started</p>
            
            {/* Demo Button - Prominent in empty state */}
            <button
              onClick={loadDemoWallets}
              className="w-full py-3 rounded-lg border-2 border-dashed border-cyber-magenta/50 bg-cyber-magenta/10 hover:bg-cyber-magenta/20 hover:border-cyber-magenta transition-all group"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🎮</span>
                <div className="text-left">
                  <p className="text-sm text-cyber-magenta font-cyber">Try Demo Mode</p>
                  <p className="text-[10px] text-cyber-muted">Load sample wallets to explore</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Add Wallet Button */}
        <button 
          onClick={() => setShowModal(true)}
          className="w-full cyber-btn flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Wallet
        </button>

        {/* Quick Actions for Active Wallet */}
        {activeWallet && (
          <div className="mt-3 pt-3 border-t border-cyber-border">
            <div className="flex items-center gap-2">
              {activeWallet.provider !== 'demo' && (
                <button 
                  onClick={() => refreshWallet(activeWallet.id)}
                  disabled={activeWallet.isLoading}
                  className="flex-1 py-1.5 text-xs rounded border border-cyber-border text-cyber-muted hover:border-cyber-glow/50 hover:text-cyber-glow transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} className={`inline mr-1 ${activeWallet.isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
              <button 
                onClick={() => setDefaultWallet(activeWallet.id)}
                disabled={activeWallet.isDefault}
                className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                  activeWallet.isDefault 
                    ? 'border-cyber-yellow/30 text-cyber-yellow/50 cursor-not-allowed'
                    : 'border-cyber-border text-cyber-muted hover:border-cyber-yellow/50 hover:text-cyber-yellow'
                }`}
              >
                <Star size={12} className="inline mr-1" />
                {activeWallet.isDefault ? 'Default' : 'Set Default'}
              </button>
              <button 
                onClick={() => removeWallet(activeWallet.id)}
                className="flex-1 py-1.5 text-xs rounded border border-cyber-border text-cyber-muted hover:border-cyber-red/50 hover:text-cyber-red transition-colors"
              >
                <Trash2 size={12} className="inline mr-1" />
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Clear Demo Wallets */}
        {hasDemoWallets && (
          <button 
            onClick={() => {
              wallets.filter(w => w.provider === 'demo').forEach(w => removeWallet(w.id));
            }}
            className="w-full mt-2 py-1.5 text-xs rounded border border-cyber-magenta/30 text-cyber-magenta/70 hover:border-cyber-magenta/50 hover:text-cyber-magenta hover:bg-cyber-magenta/10 transition-colors"
          >
            Clear Demo Wallets
          </button>
        )}
      </div>

      {/* Add Wallet Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowModal(false); setSelectedProvider(null); }}
          >
            <motion.div
              className="cyber-panel cyber-glow w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  {selectedProvider && (
                    <button 
                      onClick={() => setSelectedProvider(null)}
                      className="p-1 hover:bg-cyber-glow/10 rounded transition-colors mr-2"
                    >
                      <ChevronRight size={16} className="text-cyber-muted rotate-180" />
                    </button>
                  )}
                  <h3 className="font-cyber text-lg text-cyber-glow tracking-wider">
                    {selectedProvider ? walletProviders[selectedProvider].name : 'ADD WALLET'}
                  </h3>
                </div>
                <button 
                  onClick={() => { setShowModal(false); setSelectedProvider(null); }}
                  className="p-2 hover:bg-cyber-glow/10 rounded transition-colors"
                >
                  <X size={20} className="text-cyber-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {!selectedProvider ? (
                  // Provider Selection
                  <div className="space-y-6">
                    {Object.entries(providerCategories).map(([category, meta]) => {
                      const providers = providersByCategory[category];
                      if (!providers?.length) return null;
                      
                      const Icon = meta.icon;
                      
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-3">
                            <Icon size={14} className={`text-${meta.color}`} />
                            <span className={`font-cyber text-xs text-${meta.color} tracking-wider`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {providers.map((provider) => (
                              <button
                                key={provider.key}
                                onClick={() => handleProviderSelect(provider.key)}
                                className="p-3 rounded-lg border border-cyber-border/50 bg-cyber-darker/50 hover:border-cyber-glow/50 hover:bg-cyber-glow/5 transition-all text-left group"
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                    style={{ backgroundColor: `${provider.color}20` }}
                                  >
                                    {provider.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-cyber-text font-medium group-hover:text-cyber-glow transition-colors">
                                      {provider.name}
                                    </p>
                                    <p className="text-[10px] text-cyber-muted truncate">
                                      {provider.description}
                                    </p>
                                  </div>
                                  <ChevronRight size={14} className="text-cyber-muted group-hover:text-cyber-glow transition-colors" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Address Entry for ALL providers
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl"
                        style={{ backgroundColor: `${walletProviders[selectedProvider].color}20` }}
                      >
                        {walletProviders[selectedProvider].icon}
                      </div>
                      <h4 className="text-lg text-cyber-text font-cyber">{walletProviders[selectedProvider].name}</h4>
                      <p className="text-xs text-cyber-muted mt-1">
                        Enter your XRPL address from {walletProviders[selectedProvider].name}
                      </p>
                    </div>

                    {/* Wallet Label */}
                    <div>
                      <label className="text-xs text-cyber-muted block mb-2">Wallet Label</label>
                      <input
                        type="text"
                        value={walletLabel}
                        onChange={(e) => setWalletLabel(e.target.value)}
                        placeholder={`My ${walletProviders[selectedProvider].name} Wallet`}
                        className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow focus:outline-none"
                      />
                    </div>
                    
                    {/* XRPL Address */}
                    <div>
                      <label className="text-xs text-cyber-muted block mb-2">XRPL Address</label>
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text font-mono placeholder:text-cyber-muted focus:border-cyber-glow focus:outline-none"
                      />
                      {manualAddress && !isValidXRPLAddress(manualAddress) && (
                        <p className="text-xs text-cyber-red mt-1">Invalid XRPL address format</p>
                      )}
                      {manualAddress && isValidXRPLAddress(manualAddress) && (
                        <p className="text-xs text-cyber-green mt-1">✓ Valid address format</p>
                      )}
                    </div>

                    {/* Info Box */}
                    <div className="p-3 rounded border" style={{ 
                      backgroundColor: `${walletProviders[selectedProvider].color}10`,
                      borderColor: `${walletProviders[selectedProvider].color}30`
                    }}>
                      <p className="text-xs" style={{ color: walletProviders[selectedProvider].color }}>
                        💡 This will fetch real XRP balance, tokens, and NFTs from the ledger
                      </p>
                    </div>
                    
                    {/* How to find address hints */}
                    {(selectedProvider === 'xaman' || selectedProvider === 'joey') && (
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border">
                        <p className="text-xs text-cyber-muted mb-2">📱 How to find your address:</p>
                        <ol className="text-xs text-cyber-muted space-y-1 list-decimal list-inside">
                          <li>Open {walletProviders[selectedProvider].name} app</li>
                          <li>Go to your account/wallet</li>
                          <li>Tap to copy your r-address</li>
                          <li>Paste it above</li>
                        </ol>
                      </div>
                    )}

                    {(selectedProvider === 'binance' || selectedProvider === 'coinbase' || selectedProvider === 'kraken' || selectedProvider === 'bitstamp' || selectedProvider === 'uphold') && (
                      <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border">
                        <p className="text-xs text-cyber-muted mb-2">📊 How to find your address:</p>
                        <ol className="text-xs text-cyber-muted space-y-1 list-decimal list-inside">
                          <li>Log into {walletProviders[selectedProvider].name}</li>
                          <li>Go to Wallet → XRP</li>
                          <li>Click Deposit to see your XRP address</li>
                          <li>Copy the r-address (not the tag)</li>
                        </ol>
                      </div>
                    )}

                    <button
                      onClick={handleConnectWallet}
                      disabled={!manualAddress.trim() || !isValidXRPLAddress(manualAddress)}
                      className={`w-full py-3 rounded font-cyber text-sm transition-all ${
                        manualAddress.trim() && isValidXRPLAddress(manualAddress)
                          ? 'bg-cyber-glow/20 border border-cyber-glow text-cyber-glow hover:bg-cyber-glow/30'
                          : 'bg-cyber-darker border border-cyber-border text-cyber-muted cursor-not-allowed'
                      }`}
                    >
                      Add Wallet & Fetch Data
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

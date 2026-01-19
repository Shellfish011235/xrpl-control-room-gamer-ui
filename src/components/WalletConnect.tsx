import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Wallet, ChevronRight, Check, Trash2, Star,
  Smartphone, Building2, Landmark, FileText, Copy, RefreshCw,
  AlertCircle, Loader2, Coins, Eye, EyeOff, ChevronDown, TrendingUp, TrendingDown
} from 'lucide-react';
import { useWalletStore, walletProviders, DEMO_WALLETS } from '../store/walletStore';
import type { WalletProvider } from '../store/walletStore';
import { isValidXRPLAddress } from '../services/xrplService';

// Truncate address for display
const truncateAddress = (address: string) => {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

// Supported currencies with their symbols and names
const SUPPORTED_CURRENCIES = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '€', name: 'Euro' },
  { code: 'gbp', symbol: '£', name: 'British Pound' },
  { code: 'jpy', symbol: '¥', name: 'Japanese Yen' },
  { code: 'cad', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'aud', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'chf', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'cny', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'inr', symbol: '₹', name: 'Indian Rupee' },
  { code: 'krw', symbol: '₩', name: 'Korean Won' },
  { code: 'mxn', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'brl', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'sgd', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'hkd', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'php', symbol: '₱', name: 'Philippine Peso' },
] as const;

type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

// Hook to fetch XRP price in multiple currencies
function useXRPPrice(currency: CurrencyCode) {
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=${currency}&include_24hr_change=true`
        );
        if (!response.ok) throw new Error('Failed to fetch price');
        const data = await response.json();
        setPrice(data.ripple[currency]);
        setChange24h(data.ripple[`${currency}_24h_change`]);
      } catch (err) {
        console.error('[Price] Error fetching XRP price:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [currency]);

  return { price, change24h, loading };
}

// Category groupings
const providerCategories = {
  demo: { label: 'DEMO MODE', icon: Wallet, color: 'cyber-magenta' },
  wallet: { label: 'WALLETS', icon: Smartphone, color: 'cyber-glow' },
  exchange: { label: 'EXCHANGES', icon: Building2, color: 'cyber-yellow' },
  bank: { label: 'BANKS', icon: Landmark, color: 'cyber-purple' },
  direct: { label: 'DIRECT ENTRY', icon: FileText, color: 'cyber-cyan' },
};

export function WalletConnect() {
  const { wallets, activeWalletId, addWallet, addWalletAndFetch, removeWallet, setActiveWallet, setDefaultWallet, refreshWallet, refreshAllWallets, clearAllWallets } = useWalletStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [walletLabel, setWalletLabel] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // Privacy toggle - persisted in localStorage
  const [hideAmounts, setHideAmounts] = useState(() => {
    const saved = localStorage.getItem('xrpl-hide-amounts');
    return saved === 'true';
  });

  // Currency preference - persisted in localStorage
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('xrpl-currency');
    return (saved as CurrencyCode) || 'usd';
  });
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const { price: xrpPrice, change24h, loading: priceLoading } = useXRPPrice(selectedCurrency);

  const toggleHideAmounts = () => {
    setHideAmounts(prev => {
      const newValue = !prev;
      localStorage.setItem('xrpl-hide-amounts', String(newValue));
      return newValue;
    });
  };

  const handleCurrencyChange = (currency: CurrencyCode) => {
    setSelectedCurrency(currency);
    localStorage.setItem('xrpl-currency', currency);
    setShowCurrencyDropdown(false);
  };

  const activeWallet = wallets.find(w => w.id === activeWalletId);
  const hasDemoWallets = wallets.some(w => w.provider === 'demo');

  // Calculate total XRP balance across all wallets (excluding demo)
  const totalXRP = useMemo(() => {
    return wallets
      .filter(w => w.provider !== 'demo' && typeof w.balance === 'number')
      .reduce((sum, w) => sum + (w.balance || 0), 0);
  }, [wallets]);

  // Calculate total fiat value
  const totalFiatValue = useMemo(() => {
    if (!xrpPrice || totalXRP === 0) return null;
    return totalXRP * xrpPrice;
  }, [totalXRP, xrpPrice]);

  // Get currency info
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency)!;

  // Debug: Log wallet state changes
  useEffect(() => {
    console.log('[WalletConnect] Wallets updated:', wallets.map(w => ({
      id: w.id,
      address: w.address,
      balance: w.balance,
      balanceType: typeof w.balance,
      isLoading: w.isLoading,
      exists: w.exists,
      error: w.error,
      tokens: w.tokens?.length,
      nftCount: w.nftCount,
    })));
  }, [wallets]);

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
          <button
            onClick={toggleHideAmounts}
            className={`p-1.5 rounded transition-all ${
              hideAmounts 
                ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30' 
                : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/20'
            }`}
            title={hideAmounts ? 'Show amounts' : 'Hide amounts'}
          >
            {hideAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
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

        {/* Total Balance Section */}
        {wallets.filter(w => w.provider !== 'demo').length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-cyber-glow/10 to-cyber-blue/5 border border-cyber-glow/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-muted">Total Balance</span>
              {/* Currency Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyber-darker/50 border border-cyber-border/50 hover:border-cyber-glow/50 transition-colors text-xs"
                >
                  <span className="text-cyber-muted">{currencyInfo.code.toUpperCase()}</span>
                  <ChevronDown size={12} className={`text-cyber-muted transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Currency Dropdown */}
                <AnimatePresence>
                  {showCurrencyDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 top-full mt-1 w-44 max-h-48 overflow-y-auto cyber-panel border border-cyber-border/50 rounded-lg shadow-xl z-50"
                    >
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <button
                          key={currency.code}
                          onClick={() => handleCurrencyChange(currency.code)}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-cyber-glow/10 transition-colors ${
                            selectedCurrency === currency.code ? 'bg-cyber-glow/20 text-cyber-glow' : 'text-cyber-text'
                          }`}
                        >
                          <span>{currency.name}</span>
                          <span className="text-cyber-muted">{currency.symbol}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* XRP Amount */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-cyber text-2xl text-cyber-glow">
                {hideAmounts ? '••••••' : totalXRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </span>
              <span className="text-sm text-cyber-muted">XRP</span>
            </div>
            
            {/* Fiat Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {priceLoading ? (
                  <span className="text-sm text-cyber-muted animate-pulse">Loading...</span>
                ) : totalFiatValue !== null ? (
                  <span className="text-sm text-cyber-text">
                    {hideAmounts ? '••••••' : `${currencyInfo.symbol}${totalFiatValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                ) : (
                  <span className="text-sm text-cyber-muted">--</span>
                )}
              </div>
              
              {/* 24h Change */}
              {!priceLoading && change24h !== null && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-cyber ${
                  change24h >= 0 
                    ? 'bg-cyber-green/20 text-cyber-green' 
                    : 'bg-cyber-red/20 text-cyber-red'
                }`}>
                  {change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  <span>{Math.abs(change24h).toFixed(2)}%</span>
                </div>
              )}
            </div>
            
            {/* XRP Price */}
            {!priceLoading && xrpPrice !== null && (
              <div className="mt-2 pt-2 border-t border-cyber-border/30 flex items-center justify-between text-[10px]">
                <span className="text-cyber-muted">XRP Price</span>
                <span className="text-cyber-text">{currencyInfo.symbol}{xrpPrice.toFixed(4)}</span>
              </div>
            )}
          </div>
        )}

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
                  <div className="flex items-start gap-3">
                    {/* Provider Icon */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${provider.color}20` }}
                    >
                      {wallet.isLoading ? (
                        <Loader2 size={16} className="animate-spin text-cyber-glow" />
                      ) : (
                        provider.icon
                      )}
                    </div>
                    
                    {/* Wallet Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-cyber-text font-medium truncate">
                          {wallet.label}
                        </span>
                        {wallet.isDefault && (
                          <Star size={12} className="text-cyber-yellow fill-cyber-yellow shrink-0" />
                        )}
                        {wallet.error && (
                          <AlertCircle size={12} className="text-cyber-red shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-cyber-muted font-mono">
                          {truncateAddress(wallet.address)}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); copyAddress(wallet.address); }}
                          className="p-0.5 hover:text-cyber-glow transition-colors shrink-0"
                        >
                          {copiedAddress === wallet.address ? (
                            <Check size={10} className="text-cyber-green" />
                          ) : (
                            <Copy size={10} className="text-cyber-muted" />
                          )}
                        </button>
                      </div>
                      {/* Tokens count */}
                      {wallet.tokens && wallet.tokens.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Coins size={10} className="text-cyber-purple" />
                          <span className="text-[10px] text-cyber-purple">
                            {hideAmounts ? '••' : wallet.tokens.length} token{wallet.tokens.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Balance Section - Separate Row */}
                  <div className="mt-2 pt-2 border-t border-cyber-border/30 flex items-center justify-between">
                    <div className="text-[10px] text-cyber-muted">
                      <span>{provider.name}</span>
                      {wallet.lastUpdated && (
                        <span className="ml-2 opacity-50">
                          {new Date(wallet.lastUpdated).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      {wallet.isLoading ? (
                        <span className="text-xs text-cyber-muted animate-pulse">Loading...</span>
                      ) : wallet.balance !== undefined && wallet.balance !== null ? (
                        <span className="font-cyber text-cyber-glow font-bold tracking-wide">
                          {hideAmounts 
                            ? '••••••' 
                            : typeof wallet.balance === 'number' 
                              ? wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                              : String(wallet.balance)} <span className="text-xs opacity-70">XRP</span>
                        </span>
                      ) : (
                        <span className="text-xs text-cyber-muted">--</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Error message */}
                  {wallet.error && (
                    <p className="text-[10px] text-cyber-red mt-2 pt-2 border-t border-cyber-red/20">{wallet.error}</p>
                  )}
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

        {/* Clear Wallets Options */}
        {wallets.length > 0 && (
          <div className="mt-2 flex gap-2">
            {hasDemoWallets && (
              <button 
                onClick={() => {
                  wallets.filter(w => w.provider === 'demo').forEach(w => removeWallet(w.id));
                }}
                className="flex-1 py-1.5 text-xs rounded border border-cyber-magenta/30 text-cyber-magenta/70 hover:border-cyber-magenta/50 hover:text-cyber-magenta hover:bg-cyber-magenta/10 transition-colors"
              >
                Clear Demo
              </button>
            )}
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all wallets? This cannot be undone.')) {
                  clearAllWallets();
                }
              }}
              className="flex-1 py-1.5 text-xs rounded border border-cyber-red/30 text-cyber-red/70 hover:border-cyber-red/50 hover:text-cyber-red hover:bg-cyber-red/10 transition-colors"
            >
              Clear All Wallets
            </button>
          </div>
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getWalletData, isValidXRPLAddress, getAccountCreationYear } from '../services/xrplService';
import { useProfileStore } from './profileStore';

export type WalletProvider = 
  | 'xaman' 
  | 'joey' 
  | 'bifrost'
  | 'metamask'
  | 'trust'
  | 'binance' 
  | 'binanceus'
  | 'coinbase' 
  | 'kraken' 
  | 'bitstamp'
  | 'uphold'
  | 'robinhood'
  | 'bank'
  | 'ledger'
  | 'demo';

export interface WalletToken {
  currency: string;
  balance: number;
  issuer: string;
}

export interface ConnectedWallet {
  id: string;
  address: string;
  provider: WalletProvider;
  label: string;
  balance?: number;
  tokens?: WalletToken[];
  nftCount?: number;
  isDefault: boolean;
  connectedAt: number;
  lastUpdated?: number;
  exists?: boolean;
  isLoading?: boolean;
  error?: string;
  creationYear?: number | null; // Year the account was created on XRPL
}

interface WalletState {
  wallets: ConnectedWallet[];
  activeWalletId: string | null;
  isConnecting: boolean;
  
  // Actions
  addWallet: (wallet: Omit<ConnectedWallet, 'id' | 'connectedAt'>) => void;
  addWalletAndFetch: (wallet: Omit<ConnectedWallet, 'id' | 'connectedAt' | 'balance'>) => Promise<void>;
  removeWallet: (id: string) => void;
  setActiveWallet: (id: string) => void;
  setDefaultWallet: (id: string) => void;
  updateWalletBalance: (id: string, balance: number) => void;
  updateWalletData: (id: string, data: Partial<ConnectedWallet>) => void;
  refreshWallet: (id: string) => Promise<void>;
  refreshAllWallets: () => Promise<void>;
  setIsConnecting: (connecting: boolean) => void;
  clearAllWallets: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      activeWalletId: null,
      isConnecting: false,

      addWallet: (wallet) => {
        const newWallet: ConnectedWallet = {
          ...wallet,
          id: generateId(),
          connectedAt: Date.now(),
          isDefault: get().wallets.length === 0 ? true : wallet.isDefault,
        };
        
        set((state) => {
          // If this is set as default, unset others
          const updatedWallets = wallet.isDefault
            ? state.wallets.map(w => ({ ...w, isDefault: false }))
            : state.wallets;
          
          return {
            wallets: [...updatedWallets, newWallet],
            activeWalletId: state.activeWalletId || newWallet.id,
          };
        });
      },

      removeWallet: (id) => {
        set((state) => {
          const filtered = state.wallets.filter(w => w.id !== id);
          const wasActive = state.activeWalletId === id;
          const wasDefault = state.wallets.find(w => w.id === id)?.isDefault;
          
          // If removed wallet was default, make first remaining wallet default
          if (wasDefault && filtered.length > 0) {
            filtered[0].isDefault = true;
          }
          
          return {
            wallets: filtered,
            activeWalletId: wasActive ? (filtered[0]?.id || null) : state.activeWalletId,
          };
        });
      },

      setActiveWallet: (id) => {
        set({ activeWalletId: id });
      },

      setDefaultWallet: (id) => {
        set((state) => ({
          wallets: state.wallets.map(w => ({
            ...w,
            isDefault: w.id === id,
          })),
        }));
      },

      updateWalletBalance: (id, balance) => {
        set((state) => ({
          wallets: state.wallets.map(w =>
            w.id === id ? { ...w, balance } : w
          ),
        }));
      },

      updateWalletData: (id, data) => {
        set((state) => ({
          wallets: state.wallets.map(w =>
            w.id === id ? { ...w, ...data } : w
          ),
        }));
      },

      addWalletAndFetch: async (wallet) => {
        const id = generateId();
        const newWallet: ConnectedWallet = {
          ...wallet,
          id,
          connectedAt: Date.now(),
          isDefault: get().wallets.length === 0 ? true : wallet.isDefault,
          isLoading: true,
        };
        
        // Add wallet immediately with loading state
        set((state) => {
          const updatedWallets = wallet.isDefault
            ? state.wallets.map(w => ({ ...w, isDefault: false }))
            : state.wallets;
          
          return {
            wallets: [...updatedWallets, newWallet],
            activeWalletId: state.activeWalletId || id,
          };
        });

        // Skip fetching for demo wallets
        if (wallet.provider === 'demo') {
          set((state) => ({
            wallets: state.wallets.map(w =>
              w.id === id ? { ...w, isLoading: false, balance: 0 } : w
            ),
          }));
          return;
        }

        // Fetch real data from XRPL
        try {
          console.log(`[WalletStore] Fetching data for wallet: ${wallet.address}`);
          
          if (isValidXRPLAddress(wallet.address)) {
            // Fetch wallet data and creation year in parallel
            const [data, creationYear] = await Promise.all([
              getWalletData(wallet.address),
              getAccountCreationYear(wallet.address),
            ]);
            console.log(`[WalletStore] Got wallet data:`, data);
            console.log(`[WalletStore] Balance specifically: ${data.balance} (type: ${typeof data.balance})`);
            console.log(`[WalletStore] Creation year: ${creationYear}`);
            
            set((state) => {
              console.log(`[WalletStore] Setting wallet ${id} balance to: ${data.balance}`);
              return {
                wallets: state.wallets.map(w =>
                  w.id === id ? {
                    ...w,
                    balance: data.balance,
                    tokens: data.tokens,
                    nftCount: data.nftCount,
                    exists: data.exists,
                    isLoading: false,
                    lastUpdated: Date.now(),
                    creationYear: creationYear,
                    error: data.exists ? undefined : 'Account not found on ledger',
                  } : w
                ),
              };
            });

            // Update profile's memberSinceYear if this is the oldest wallet
            if (creationYear) {
              const currentMemberSince = useProfileStore.getState().memberSinceYear;
              if (!currentMemberSince || creationYear < currentMemberSince) {
                useProfileStore.getState().setMemberSinceYear(creationYear);
              }
            }
          } else {
            console.log(`[WalletStore] Invalid address format: ${wallet.address}`);
            set((state) => ({
              wallets: state.wallets.map(w =>
                w.id === id ? { ...w, isLoading: false, error: 'Invalid XRPL address' } : w
              ),
            }));
          }
        } catch (error) {
          console.error(`[WalletStore] Error fetching wallet data:`, error);
          set((state) => ({
            wallets: state.wallets.map(w =>
              w.id === id ? { 
                ...w, 
                isLoading: false, 
                error: error instanceof Error ? error.message : 'Failed to fetch data. Check console for details.' 
              } : w
            ),
          }));
        }
      },

      refreshWallet: async (id) => {
        const wallet = get().wallets.find(w => w.id === id);
        if (!wallet || wallet.provider === 'demo') return;

        console.log(`[WalletStore] Refreshing wallet: ${wallet.address}`);

        set((state) => ({
          wallets: state.wallets.map(w =>
            w.id === id ? { ...w, isLoading: true, error: undefined } : w
          ),
        }));

        try {
          if (isValidXRPLAddress(wallet.address)) {
            const data = await getWalletData(wallet.address);
            console.log(`[WalletStore] Refresh complete:`, data);
            
            set((state) => ({
              wallets: state.wallets.map(w =>
                w.id === id ? {
                  ...w,
                  balance: data.balance,
                  tokens: data.tokens,
                  nftCount: data.nftCount,
                  exists: data.exists,
                  isLoading: false,
                  lastUpdated: Date.now(),
                  error: data.exists ? undefined : 'Account not found on ledger',
                } : w
              ),
            }));
          }
        } catch (error) {
          console.error(`[WalletStore] Refresh error:`, error);
          set((state) => ({
            wallets: state.wallets.map(w =>
              w.id === id ? { 
                ...w, 
                isLoading: false, 
                error: error instanceof Error ? error.message : 'Failed to fetch data. Check console.' 
              } : w
            ),
          }));
        }
      },

      refreshAllWallets: async () => {
        const { wallets, refreshWallet } = get();
        const realWallets = wallets.filter(w => w.provider !== 'demo');
        await Promise.all(realWallets.map(w => refreshWallet(w.id)));
      },

      setIsConnecting: (connecting) => {
        set({ isConnecting: connecting });
      },

      clearAllWallets: () => {
        set({ wallets: [], activeWalletId: null });
      },
    }),
    {
      name: 'xrpl-wallet-state',
    }
  )
);

// Provider metadata
export const walletProviders: Record<WalletProvider, {
  name: string;
  icon: string;
  color: string;
  category: 'wallet' | 'exchange' | 'bank' | 'direct' | 'demo';
  description: string;
}> = {
  xaman: {
    name: 'Xaman',
    icon: '📱',
    color: '#3052FF',
    category: 'wallet',
    description: 'Scan QR code with Xaman app',
  },
  joey: {
    name: 'Joey',
    icon: '🦘',
    color: '#FF6B35',
    category: 'wallet',
    description: 'Connect with Joey wallet',
  },
  bifrost: {
    name: 'Bifrost',
    icon: '🌈',
    color: '#7B3FE4',
    category: 'wallet',
    description: 'Connect with Bifrost wallet',
  },
  metamask: {
    name: 'MetaMask',
    icon: '🦊',
    color: '#F6851B',
    category: 'wallet',
    description: 'Connect via MetaMask (EVM sidechain)',
  },
  trust: {
    name: 'Trust Wallet',
    icon: '🛡️',
    color: '#3375BB',
    category: 'wallet',
    description: 'Connect with Trust Wallet',
  },
  binance: {
    name: 'Binance',
    icon: '🔶',
    color: '#F0B90B',
    category: 'exchange',
    description: 'Import from Binance',
  },
  binanceus: {
    name: 'Binance.US',
    icon: '🔷',
    color: '#F0B90B',
    category: 'exchange',
    description: 'Import from Binance.US',
  },
  coinbase: {
    name: 'Coinbase',
    icon: '🔵',
    color: '#0052FF',
    category: 'exchange',
    description: 'Import from Coinbase',
  },
  kraken: {
    name: 'Kraken',
    icon: '🐙',
    color: '#5741D9',
    category: 'exchange',
    description: 'Import from Kraken',
  },
  bitstamp: {
    name: 'Bitstamp',
    icon: '🟢',
    color: '#2ECC71',
    category: 'exchange',
    description: 'Import from Bitstamp',
  },
  uphold: {
    name: 'Uphold',
    icon: '🟩',
    color: '#49CC68',
    category: 'exchange',
    description: 'Import from Uphold',
  },
  robinhood: {
    name: 'Robinhood',
    icon: '🪶',
    color: '#00C805',
    category: 'exchange',
    description: 'Import from Robinhood',
  },
  bank: {
    name: 'Bank Account',
    icon: '🏦',
    color: '#6B7280',
    category: 'bank',
    description: 'Link bank for fiat on/off ramp',
  },
  ledger: {
    name: 'Direct Address',
    icon: '📝',
    color: '#00D4FF',
    category: 'direct',
    description: 'Enter XRPL address manually',
  },
  demo: {
    name: 'Demo Wallet',
    icon: '🎮',
    color: '#FF00FF',
    category: 'demo',
    description: 'Try the app with a demo wallet',
  },
};

// Demo wallet data
export const DEMO_WALLETS = [
  {
    address: 'rDemoXRPLWallet1234567890abcdefg',
    provider: 'demo' as WalletProvider,
    label: 'Demo Main Wallet',
    balance: 15420,
    isDefault: true,
  },
  {
    address: 'rDemoSavings9876543210zyxwvuts',
    provider: 'demo' as WalletProvider,
    label: 'Demo Savings',
    balance: 52000,
    isDefault: false,
  },
  {
    address: 'rDemoTradingABCDEF123456789xyz',
    provider: 'demo' as WalletProvider,
    label: 'Demo Trading',
    balance: 3250,
    isDefault: false,
  },
];

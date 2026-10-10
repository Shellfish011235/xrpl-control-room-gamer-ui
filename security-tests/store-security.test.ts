import assert from 'node:assert/strict';
import { useWalletStore } from '../src/store/walletStore';
import { useBountyStore } from '../src/store/bountyStore';

const first = { id:'w1', address:'r1', provider:'demo' as const, label:'one', isDefault:false, connectedAt:1 };
const removed = { id:'w2', address:'r2', provider:'demo' as const, label:'two', isDefault:true, connectedAt:2 };
useWalletStore.setState({ wallets:[first, removed], activeWalletId:'w2', isConnecting:false });
useWalletStore.getState().removeWallet('w2');
assert.equal(first.isDefault, false, 'removeWallet must not mutate prior wallet object');
assert.equal(useWalletStore.getState().wallets[0].isDefault, true, 'replacement default must be a new object');

useBountyStore.setState({ reputation:{ completedBounties:0, totalXRPEarned:10, lastActivityAt:0 } });
useBountyStore.getState().addReputationCompletion(Number.NaN);
assert.equal(useBountyStore.getState().reputation.totalXRPEarned, 10, 'NaN reward must be ignored');
useBountyStore.getState().addReputationCompletion(-5);
assert.equal(useBountyStore.getState().reputation.totalXRPEarned, 10, 'negative reward must be ignored');
console.log('store security regressions: PASS');

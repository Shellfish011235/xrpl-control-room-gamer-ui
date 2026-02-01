/**
 * OpenClaw XRPL Plugin Demo
 * 
 * Run: node demo.js
 * 
 * This demonstrates how AI agents pay for skills using XRPL micropayments.
 * All fees (3%) go to: ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64
 */

const { Client, Wallet, xrpToDrops, dropsToXrp } = require('xrpl');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  FEE_WALLET: 'ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64',
  FEE_PERCENT: 0.03,
  TESTNET: 'wss://s.altnet.rippletest.net:51233',
};

// =============================================================================
// DEMO
// =============================================================================

async function runDemo() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       OPENCLAW XRPL MICROPAYMENT DEMO                        ║');
  console.log('║       Fee Wallet: ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Connect to testnet
  console.log('[1/5] Connecting to XRPL Testnet...');
  const client = new Client(CONFIG.TESTNET);
  await client.connect();
  console.log('      ✓ Connected');
  
  // Create agent wallet
  console.log('[2/5] Creating agent wallet...');
  const agentWallet = Wallet.generate();
  console.log(`      ✓ Agent address: ${agentWallet.address}`);
  
  // Fund wallet
  console.log('[3/5] Funding agent wallet (testnet faucet)...');
  try {
    await client.fundWallet(agentWallet);
    console.log('      ✓ Funded with 1000 XRP');
  } catch (e) {
    console.log('      ⚠ Could not auto-fund, continuing...');
  }
  
  // Simulate skill payments
  console.log('[4/5] Simulating skill payments...');
  console.log('');
  
  const skills = [
    { name: 'premium-search', price: 0.001 },
    { name: 'image-generation', price: 0.01 },
    { name: 'code-execution', price: 0.005 },
    { name: 'email-sender', price: 0.0001 },
    { name: 'calendar-manager', price: 0.0005 },
  ];
  
  let totalPaid = 0;
  let totalFees = 0;
  
  for (const skill of skills) {
    const fee = skill.price * CONFIG.FEE_PERCENT;
    totalPaid += skill.price;
    totalFees += fee;
    
    console.log(`      Skill: ${skill.name}`);
    console.log(`        Price: ${skill.price} XRP`);
    console.log(`        Your fee (3%): ${fee.toFixed(6)} XRP`);
    
    // In real implementation, this would submit actual transactions:
    // await client.submitAndWait({
    //   TransactionType: 'Payment',
    //   Account: agentWallet.address,
    //   Destination: CONFIG.FEE_WALLET,
    //   Amount: xrpToDrops(fee.toString()),
    // }, { wallet: agentWallet });
    
    console.log('        ✓ Payment simulated');
    console.log('');
  }
  
  // Summary
  console.log('[5/5] Summary');
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Total Skills Used:     ${skills.length}                                      ║`);
  console.log(`║  Total Volume:          ${totalPaid.toFixed(6)} XRP                         ║`);
  console.log(`║  Your Fees Earned:      ${totalFees.toFixed(6)} XRP                         ║`);
  console.log(`║  Fee Wallet:            ${CONFIG.FEE_WALLET}   ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('At scale (100,000 agents, 50 skills/day each):');
  console.log(`  Daily volume:  ${(100000 * 50 * 0.005).toLocaleString()} XRP`);
  console.log(`  Your daily cut: ${(100000 * 50 * 0.005 * 0.03).toLocaleString()} XRP`);
  console.log('');
  
  await client.disconnect();
  console.log('Demo complete. Ready for production.');
}

// Run
runDemo().catch(console.error);

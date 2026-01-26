// CARV - Merkle Tree for Batch Attestation
// Cryptographic proof aggregation for PIE batches

import {
  PaymentIntentEnvelope,
  SignedPIE,
  MerkleProof,
  AttestationBatch,
} from './types';

// ==================== UTILITIES ====================

/**
 * SHA-256 hash (browser-compatible)
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Concatenate and hash two nodes
 */
async function hashPair(left: string, right: string): Promise<string> {
  // Sort to ensure consistent ordering
  const [a, b] = left < right ? [left, right] : [right, left];
  return sha256(a + b);
}

/**
 * Generate UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ==================== MERKLE TREE CLASS ====================

export class MerkleTree {
  private leaves: string[] = [];
  private layers: string[][] = [];
  private leafToIndex: Map<string, number> = new Map();

  constructor() {}

  /**
   * Add leaves from PIEs
   */
  async addLeaves(items: (PaymentIntentEnvelope | SignedPIE | string)[]): Promise<void> {
    for (const item of items) {
      let leafData: string;
      
      if (typeof item === 'string') {
        leafData = item;
      } else if ('signature' in item) {
        // SignedPIE
        leafData = JSON.stringify(item.pie) + item.signature;
      } else {
        // PaymentIntentEnvelope
        leafData = JSON.stringify(item);
      }
      
      const leafHash = await sha256(leafData);
      this.leafToIndex.set(leafHash, this.leaves.length);
      this.leaves.push(leafHash);
    }
  }

  /**
   * Build the Merkle tree from leaves
   */
  async build(): Promise<string> {
    if (this.leaves.length === 0) {
      throw new Error('Cannot build tree with no leaves');
    }

    this.layers = [this.leaves.slice()];
    
    let currentLayer = this.leaves.slice();
    
    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
        const parent = await hashPair(left, right);
        nextLayer.push(parent);
      }
      
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    return this.getRoot();
  }

  /**
   * Get Merkle root
   */
  getRoot(): string {
    if (this.layers.length === 0) {
      throw new Error('Tree not built yet');
    }
    return this.layers[this.layers.length - 1][0];
  }

  /**
   * Get proof for a leaf
   */
  async getProof(leafHash: string): Promise<MerkleProof> {
    const leafIndex = this.leafToIndex.get(leafHash);
    
    if (leafIndex === undefined) {
      throw new Error('Leaf not found in tree');
    }

    const proofPath: string[] = [];
    let currentIndex = leafIndex;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
      
      if (siblingIndex < layer.length) {
        proofPath.push(layer[siblingIndex]);
      } else {
        proofPath.push(layer[currentIndex]); // Duplicate if no sibling
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      root: this.getRoot(),
      leaf_hash: leafHash,
      proof_path: proofPath,
      leaf_index: leafIndex,
      tree_size: this.leaves.length,
    };
  }

  /**
   * Verify a Merkle proof
   */
  static async verifyProof(proof: MerkleProof): Promise<boolean> {
    let currentHash = proof.leaf_hash;
    let currentIndex = proof.leaf_index;

    for (const siblingHash of proof.proof_path) {
      const isRightNode = currentIndex % 2 === 1;
      
      if (isRightNode) {
        currentHash = await hashPair(siblingHash, currentHash);
      } else {
        currentHash = await hashPair(currentHash, siblingHash);
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }

    return currentHash === proof.root;
  }

  /**
   * Get all leaves
   */
  getLeaves(): string[] {
    return [...this.leaves];
  }

  /**
   * Get tree depth
   */
  getDepth(): number {
    return this.layers.length;
  }

  /**
   * Clear the tree
   */
  clear(): void {
    this.leaves = [];
    this.layers = [];
    this.leafToIndex.clear();
  }
}

// ==================== BATCH ATTESTATION ====================

export class BatchAttestor {
  private pendingPIEs: SignedPIE[] = [];
  private batchSize: number;
  private batches: AttestationBatch[] = [];

  constructor(batchSize: number = 10) {
    this.batchSize = batchSize;
  }

  /**
   * Add a signed PIE to pending batch
   */
  addToBatch(signedPie: SignedPIE): void {
    this.pendingPIEs.push(signedPie);
  }

  /**
   * Check if batch is ready
   */
  isBatchReady(): boolean {
    return this.pendingPIEs.length >= this.batchSize;
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.pendingPIEs.length;
  }

  /**
   * Create attestation batch
   */
  async createBatch(forceBatch: boolean = false): Promise<AttestationBatch | null> {
    if (this.pendingPIEs.length === 0) {
      return null;
    }

    if (!forceBatch && this.pendingPIEs.length < this.batchSize) {
      return null;
    }

    const piesToBatch = this.pendingPIEs.splice(0, this.batchSize);
    
    // Build Merkle tree
    const tree = new MerkleTree();
    await tree.addLeaves(piesToBatch);
    const merkleRoot = await tree.build();

    const batch: AttestationBatch = {
      batch_id: generateUUID(),
      merkle_root: merkleRoot,
      pies: piesToBatch,
      created_at: new Date().toISOString(),
    };

    this.batches.push(batch);
    return batch;
  }

  /**
   * Attest a batch (in production, anchor to chain)
   */
  async attestBatch(batch: AttestationBatch): Promise<AttestationBatch> {
    // In production, this would:
    // 1. Submit Merkle root to XRPL as memo
    // 2. Or anchor to other persistence layer
    
    const attestedBatch: AttestationBatch = {
      ...batch,
      attested_at: new Date().toISOString(),
      anchor_tx: `simulated_tx_${batch.batch_id.slice(0, 8)}`,
    };

    // Update in storage
    const idx = this.batches.findIndex(b => b.batch_id === batch.batch_id);
    if (idx >= 0) {
      this.batches[idx] = attestedBatch;
    }

    return attestedBatch;
  }

  /**
   * Get proof for a PIE in a batch
   */
  async getProofForPIE(batchId: string, intentId: string): Promise<MerkleProof | null> {
    const batch = this.batches.find(b => b.batch_id === batchId);
    if (!batch) return null;

    const pie = batch.pies.find(p => p.pie.intent_id === intentId);
    if (!pie) return null;

    const tree = new MerkleTree();
    await tree.addLeaves(batch.pies);
    await tree.build();

    const leafData = JSON.stringify(pie.pie) + pie.signature;
    const leafHash = await sha256(leafData);

    return tree.getProof(leafHash);
  }

  /**
   * Get all batches
   */
  getBatches(): AttestationBatch[] {
    return [...this.batches];
  }

  /**
   * Get pending PIEs
   */
  getPendingPIEs(): SignedPIE[] {
    return [...this.pendingPIEs];
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.pendingPIEs = [];
    this.batches = [];
  }
}

// ==================== EXPORTS ====================

export default {
  MerkleTree,
  BatchAttestor,
};

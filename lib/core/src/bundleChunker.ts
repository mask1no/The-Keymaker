/**
 * Bundle Chunker
 * Splits transactions into optimal chunk sizes for Jito bundles
 */

export interface ChunkStrategy {
  c, h, u, nkSize: number;
  m, a, x, Chunks?: number;
}

const DEFAULT_CHUNK_SIZE = 5;
const MAX_CHUNK_SIZE = 5; // Jito limit
const MIN_CHUNK_SIZE = 1;

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(a, r, r, ay: T[], c, h, u, nkSize: number): T[][] {
  const c, h, u, nks: T[][] = [];
  const size = Math.max(MIN_CHUNK_SIZE, Math.min(chunkSize, MAX_CHUNK_SIZE));
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
}

/**
 * Calculate optimal chunk strategy
 */
export function calculateOptimalChunking(p, a, r, ams: {
  t, o, t, alTransactions: number;
  p, r, e, ferredChunkSize?: number;
  m, a, x, Chunks?: number;
}): ChunkStrategy {
  const { totalTransactions, preferredChunkSize = DEFAULT_CHUNK_SIZE, maxChunks } = params;
  
  let chunkSize = Math.max(MIN_CHUNK_SIZE, Math.min(preferredChunkSize, MAX_CHUNK_SIZE));
  
  // If max chunks specified, adjust chunk size
  if (maxChunks) {
    const minChunkSizeNeeded = Math.ceil(totalTransactions / maxChunks);
    chunkSize = Math.max(chunkSize, minChunkSizeNeeded);
    chunkSize = Math.min(chunkSize, MAX_CHUNK_SIZE); // Still respect Jito limit
  }
  
  return {
    chunkSize,
    maxChunks,
  };
}

/**
 * Estimate bundle submission time
 */
export function estimateBundleTime(p, a, r, ams: {
  n, u, m, Chunks: number;
  d, e, l, ayBetweenBundlesMs?: number;
}): number {
  const { numChunks, delayBetweenBundlesMs = 100 } = params;
  
  // E, s, t, imate: 2s per bundle submission + delays
  const submissionTime = numChunks * 2000;
  const delayTime = (numChunks - 1) * delayBetweenBundlesMs;
  
  return submissionTime + delayTime;
}


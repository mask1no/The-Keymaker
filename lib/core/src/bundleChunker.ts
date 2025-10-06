/**
 * Bundle Chunker
 * Splits transactions into optimal chunk sizes for Jito bundles
 */

export interface ChunkStrategy {
  chunkSize: number;
  maxChunks?: number;
}

const DEFAULT_CHUNK_SIZE = 5;
const MAX_CHUNK_SIZE = 5; // Jito limit
const MIN_CHUNK_SIZE = 1;

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  const size = Math.max(MIN_CHUNK_SIZE, Math.min(chunkSize, MAX_CHUNK_SIZE));

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

/**
 * Calculate optimal chunk strategy
 */
export function calculateOptimalChunking(params: {
  totalTransactions: number;
  preferredChunkSize?: number;
  maxChunks?: number;
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
export function estimateBundleTime(params: {
  numChunks: number;
  delayBetweenBundlesMs?: number;
}): number {
  const { numChunks, delayBetweenBundlesMs = 100 } = params;

  // Estimate: 2s per bundle submission + delays
  const submissionTime = numChunks * 2000;
  const delayTime = (numChunks - 1) * delayBetweenBundlesMs;

  return submissionTime + delayTime;
}

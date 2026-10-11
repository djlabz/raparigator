export const DHASH_WIDTH = 9;
export const DHASH_HEIGHT = 8;
export const IMAGE_BLOCK_HAMMING_THRESHOLD = 10;
export const IMAGE_HASH_MIN_SET_BITS = 8;
export const IMAGE_HASH_MAX_SET_BITS = 56;

const HASH_HEX_LENGTH = 16;

export function dHash64(gray9x8: Uint8Array): string {
  if (gray9x8.length !== DHASH_WIDTH * DHASH_HEIGHT) {
    throw new Error(`dHash64 espera ${DHASH_WIDTH * DHASH_HEIGHT} pixels em tons de cinza`);
  }
  let hash = 0n;
  for (let row = 0; row < DHASH_HEIGHT; row += 1) {
    for (let column = 0; column < DHASH_WIDTH - 1; column += 1) {
      const left = gray9x8[row * DHASH_WIDTH + column]!;
      const right = gray9x8[row * DHASH_WIDTH + column + 1]!;
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash.toString(16).padStart(HASH_HEX_LENGTH, "0");
}

function popcount(value: bigint): number {
  let count = 0;
  let rest = value;
  while (rest > 0n) {
    count += Number(rest & 1n);
    rest >>= 1n;
  }
  return count;
}

export function hashSetBits(hash: string): number {
  return popcount(BigInt(`0x${hash}`));
}

export function hammingDistanceHex(a: string, b: string): number {
  return popcount(BigInt(`0x${a}`) ^ BigInt(`0x${b}`));
}

export function isInformativeHash(hash: string): boolean {
  const bits = hashSetBits(hash);
  return bits >= IMAGE_HASH_MIN_SET_BITS && bits <= IMAGE_HASH_MAX_SET_BITS;
}

export function isBlockedHash(
  hash: string,
  blockedHashes: readonly string[],
  threshold: number = IMAGE_BLOCK_HAMMING_THRESHOLD,
): boolean {
  if (!isInformativeHash(hash)) {
    return false;
  }
  return blockedHashes.some(
    (blocked) => isInformativeHash(blocked) && hammingDistanceHex(hash, blocked) <= threshold,
  );
}

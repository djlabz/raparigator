import { describe, expect, it } from "vitest";
import {
  DHASH_HEIGHT,
  DHASH_WIDTH,
  IMAGE_BLOCK_HAMMING_THRESHOLD,
  IMAGE_HASH_MAX_SET_BITS,
  IMAGE_HASH_MIN_SET_BITS,
  dHash64,
  hammingDistanceHex,
  hashSetBits,
  isBlockedHash,
  isInformativeHash,
} from "../src/image-hash";

function grid(rowFor: (row: number) => number[]) {
  const values: number[] = [];
  for (let row = 0; row < DHASH_HEIGHT; row += 1) {
    values.push(...rowFor(row));
  }
  return new Uint8Array(values);
}

const ascending = [0, 10, 20, 30, 40, 50, 60, 70, 80];
const descending = [...ascending].reverse();

describe("hash perceptual de imagem (dHash 64 bits)", () => {
  it("usa uma grade 9x8 e o limiar de Hamming 10", () => {
    expect(DHASH_WIDTH).toBe(9);
    expect(DHASH_HEIGHT).toBe(8);
    expect(IMAGE_BLOCK_HAMMING_THRESHOLD).toBe(10);
    expect(IMAGE_HASH_MIN_SET_BITS).toBe(8);
    expect(IMAGE_HASH_MAX_SET_BITS).toBe(56);
  });

  it("liga o bit quando o pixel da esquerda é mais claro que o da direita, linha a linha", () => {
    expect(dHash64(grid(() => ascending))).toBe("0000000000000000");
    expect(dHash64(grid(() => descending))).toBe("ffffffffffffffff");
    expect(dHash64(grid((row) => (row === 0 ? descending : ascending)))).toBe("ff00000000000000");
    expect(dHash64(grid((row) => (row % 2 === 0 ? descending : ascending)))).toBe(
      "ff00ff00ff00ff00",
    );
    expect(dHash64(grid(() => [9, 0, 9, 0, 9, 0, 9, 0, 9]))).toBe("aaaaaaaaaaaaaaaa");
  });

  it("recusa buffer que não tem 72 pixels", () => {
    expect(() => dHash64(new Uint8Array(71))).toThrow();
  });

  it("calcula distância de Hamming entre dois hashes hexadecimais", () => {
    expect(hammingDistanceHex("0000000000000000", "0000000000000000")).toBe(0);
    expect(hammingDistanceHex("ff00000000000000", "0000000000000000")).toBe(8);
    expect(hammingDistanceHex("ffffffffffffffff", "0000000000000000")).toBe(64);
    expect(hammingDistanceHex("aaaaaaaaaaaaaaaa", "5555555555555555")).toBe(64);
  });

  it("conta os bits ligados e só considera informativo entre 8 e 56", () => {
    expect(hashSetBits("0000000000000000")).toBe(0);
    expect(hashSetBits("ff00ff00ff00ff00")).toBe(32);
    expect(isInformativeHash("0000000000000000")).toBe(false);
    expect(isInformativeHash("7f00000000000000")).toBe(false);
    expect(isInformativeHash("ff00000000000000")).toBe(true);
    expect(isInformativeHash("ffffffffffffff00")).toBe(true);
    expect(isInformativeHash("ffffffffffffff80")).toBe(false);
    expect(isInformativeHash("ffffffffffffffff")).toBe(false);
  });

  it("bloqueia hash a até 10 bits de um hash bloqueado e libera a partir de 11", () => {
    const blocked = "ff00ff00ff00ff00";
    expect(isBlockedHash(blocked, [blocked])).toBe(true);
    expect(isBlockedHash("ff00ff00ff00fc00", [blocked])).toBe(true);
    expect(isBlockedHash("ff00ff00ff0000c0", [blocked])).toBe(true);
    expect(hammingDistanceHex("ff00ff00ff0000c0", blocked)).toBe(10);
    expect(isBlockedHash("ff00ff00ff0000e0", [blocked])).toBe(false);
    expect(hammingDistanceHex("ff00ff00ff0000e0", blocked)).toBe(11);
    expect(isBlockedHash("00ff00ff00ff00ff", [blocked])).toBe(false);
    expect(isBlockedHash(blocked, [])).toBe(false);
  });

  it("não compara hash pouco informativo nem contra hash pouco informativo", () => {
    expect(isBlockedHash("0000000000000000", ["0000000000000000"])).toBe(false);
    expect(isBlockedHash("0000000000000001", ["0000000000000000"])).toBe(false);
    expect(isBlockedHash("ff00000000000000", ["0000000000000000"])).toBe(false);
    expect(isBlockedHash("ffffffffffffffff", ["ffffffffffffffff"])).toBe(false);
  });
});

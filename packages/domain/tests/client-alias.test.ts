import { describe, expect, it } from "vitest";
import {
  CLIENT_ALIAS_DIGITS,
  CLIENT_ALIAS_FIRST_WORDS,
  CLIENT_ALIAS_PATTERN,
  CLIENT_ALIAS_SECOND_WORDS,
  generateClientAlias,
} from "../src/client-alias";

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length]!;
}

describe("apelido automático do cliente", () => {
  it("monta duas palavras e três dígitos no formato Palavra-Palavra-123", () => {
    const alias = generateClientAlias(sequence([0, 0, 0.482]));
    expect(alias).toBe(`${CLIENT_ALIAS_FIRST_WORDS[0]}-${CLIENT_ALIAS_SECOND_WORDS[0]}-482`);
    expect(alias).toMatch(CLIENT_ALIAS_PATTERN);
    expect(CLIENT_ALIAS_DIGITS).toBe(3);
  });

  it("completa os dígitos com zeros à esquerda e respeita o limite das listas", () => {
    const low = generateClientAlias(sequence([0, 0, 0.007]));
    expect(low.endsWith("-007")).toBe(true);
    expect(low).toMatch(CLIENT_ALIAS_PATTERN);

    const high = generateClientAlias(sequence([0.9999, 0.9999, 0.9999]));
    expect(high).toBe(`${CLIENT_ALIAS_FIRST_WORDS.at(-1)}-${CLIENT_ALIAS_SECOND_WORDS.at(-1)}-999`);
  });

  it("palavras são neutras, sem acento e com inicial maiúscula", () => {
    const words = [...CLIENT_ALIAS_FIRST_WORDS, ...CLIENT_ALIAS_SECOND_WORDS];
    expect(new Set(words).size).toBe(words.length);
    for (const word of words) {
      expect(word).toMatch(/^[A-Z][a-z]+$/);
    }
    expect(CLIENT_ALIAS_FIRST_WORDS.length).toBeGreaterThanOrEqual(16);
    expect(CLIENT_ALIAS_SECOND_WORDS.length).toBeGreaterThanOrEqual(16);
  });

  it("sempre casa com o padrão para qualquer sorteio", () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      expect(generateClientAlias(Math.random)).toMatch(CLIENT_ALIAS_PATTERN);
    }
  });
});

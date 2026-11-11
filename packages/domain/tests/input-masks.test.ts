import { describe, expect, it } from "vitest";
import {
  formatCardCvv,
  formatCardExpiry,
  formatCardNumber,
  formatCurrencyInput,
  formatHeightInput,
  formatIntegerGroup,
  formatTimeInput,
  formatWeightInput,
  sanitizeCityInput,
} from "../src/input-masks";

describe("input-masks", () => {
  it("agrupa milhares com ponto e tira zeros à esquerda", () => {
    expect(formatIntegerGroup("0001234567")).toBe("1.234.567");
    expect(formatIntegerGroup("000")).toBe("0");
    expect(formatIntegerGroup("")).toBe("0");
  });

  it("moeda digitada vira centavos com vírgula", () => {
    expect(formatCurrencyInput("")).toBe("");
    expect(formatCurrencyInput("5")).toBe("0,05");
    expect(formatCurrencyInput("R$ 1.500,00")).toBe("1.500,00");
    expect(formatCurrencyInput("35000")).toBe("350,00");
  });

  it("peso tem uma casa decimal e teto de 100,0", () => {
    expect(formatWeightInput("")).toBe("");
    expect(formatWeightInput("5")).toBe("0,5");
    expect(formatWeightInput("625")).toBe("62,5");
    expect(formatWeightInput("99999")).toBe("100,0");
  });

  it("altura fica com até 3 dígitos e hora com dois-pontos", () => {
    expect(formatHeightInput("1,70 m")).toBe("170");
    expect(formatHeightInput("12345")).toBe("123");
    expect(formatTimeInput("9")).toBe("9");
    expect(formatTimeInput("0930")).toBe("09:30");
    expect(formatTimeInput("23:59:59")).toBe("23:59");
  });

  it("cidade aceita só letras, apóstrofo, hífen e um espaço", () => {
    expect(sanitizeCityInput("São  Paulo 123!")).toBe("São Paulo ");
    expect(sanitizeCityInput("Pau-d'Alho")).toBe("Pau-d'Alho");
    expect(sanitizeCityInput("a".repeat(80))).toHaveLength(60);
  });

  it("cartão: número em blocos de 4, validade MM/AA e CVV de até 4 dígitos", () => {
    expect(formatCardNumber("4111111111111111999")).toBe("4111 1111 1111 1111");
    expect(formatCardNumber("41111")).toBe("4111 1");
    expect(formatCardExpiry("1")).toBe("1");
    expect(formatCardExpiry("1229")).toBe("12/29");
    expect(formatCardCvv("12a345")).toBe("1234");
  });
});

import { describe, expect, it } from "vitest";
import {
  EARNINGS_HOURLY_STEP,
  EARNINGS_WEEKS_PER_MONTH,
  amountForDeadline,
  buildEarningsScenarios,
  evaluateEarningsGoal,
  monthlyProjection,
  monthsToReach,
  reserveTarget,
  yearlyProjection,
} from "../src/earnings-simulator";

const base = { hourly: 300, contacts: 4, days: 5 };
const baseMonthly = 300 * 4 * 5 * 4.33;

describe("projeção do simulador", () => {
  it("projeção por mês = valor × contatos × dias × 4,33", () => {
    expect(EARNINGS_WEEKS_PER_MONTH).toBe(4.33);
    expect(monthlyProjection(base)).toBeCloseTo(baseMonthly, 6);
  });

  it("projeção por ano = 12 × projeção por mês", () => {
    expect(yearlyProjection(base)).toBeCloseTo(12 * baseMonthly, 6);
  });

  it("entrada inválida devolve null", () => {
    expect(monthlyProjection({ ...base, days: 8 })).toBeNull();
    expect(monthlyProjection({ ...base, days: 0 })).toBeNull();
    expect(monthlyProjection({ ...base, hourly: 0 })).toBeNull();
    expect(monthlyProjection({ ...base, contacts: -1 })).toBeNull();
    expect(monthlyProjection({ ...base, hourly: Number.NaN })).toBeNull();
    expect(yearlyProjection({ ...base, days: 8 })).toBeNull();
  });
});

describe("metas", () => {
  it("reserva de 3 e de 6 meses = 3 e 6 × projeção por mês", () => {
    expect(reserveTarget(baseMonthly, 3)).toBeCloseTo(3 * baseMonthly, 6);
    expect(reserveTarget(baseMonthly, 6)).toBeCloseTo(6 * baseMonthly, 6);
  });

  it("meses até um valor arredonda para cima", () => {
    expect(monthsToReach(10_000, 3_000)).toBe(4);
    expect(monthsToReach(9_000, 3_000)).toBe(3);
  });

  it("valor livre vazio ou ≤ 0 devolve null", () => {
    expect(monthsToReach(null, 3_000)).toBeNull();
    expect(monthsToReach(0, 3_000)).toBeNull();
    expect(monthsToReach(-10, 3_000)).toBeNull();
    expect(monthsToReach(10_000, 0)).toBeNull();
  });

  it("prazo definido devolve o montante", () => {
    expect(amountForDeadline(12, 3_000)).toBe(36_000);
    expect(amountForDeadline(null, 3_000)).toBeNull();
    expect(amountForDeadline(0, 3_000)).toBeNull();
  });

  it("avalia cada meta a partir da projeção por mês", () => {
    expect(evaluateEarningsGoal({ goal: "reserve3", monthly: 3_000, customValue: null })).toEqual({
      target: 9_000,
      months: 3,
    });
    expect(evaluateEarningsGoal({ goal: "reserve6", monthly: 3_000, customValue: null })).toEqual({
      target: 18_000,
      months: 6,
    });
    expect(
      evaluateEarningsGoal({ goal: "customAmount", monthly: 3_000, customValue: 10_000 }),
    ).toEqual({ target: 10_000, months: 4 });
    expect(
      evaluateEarningsGoal({ goal: "customDeadline", monthly: 3_000, customValue: 5 }),
    ).toEqual({ target: 15_000, months: 5 });
    expect(evaluateEarningsGoal({ goal: "customAmount", monthly: 3_000, customValue: null })).toBe(
      null,
    );
    expect(evaluateEarningsGoal({ goal: "customDeadline", monthly: 3_000, customValue: 0 })).toBe(
      null,
    );
  });
});

describe("cenários", () => {
  it("compara ±1 dia e ±1 passo de valor, sem multiplicador de Premium", () => {
    const scenarios = buildEarningsScenarios(base);
    expect(scenarios.map((scenario) => scenario.id)).toEqual([
      "fewerDays",
      "moreDays",
      "lowerValue",
      "higherValue",
    ]);
    const byId = Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario]));
    expect(byId.fewerDays!.input).toEqual({ ...base, days: 4 });
    expect(byId.moreDays!.input).toEqual({ ...base, days: 6 });
    expect(byId.lowerValue!.input).toEqual({ ...base, hourly: 300 - EARNINGS_HOURLY_STEP });
    expect(byId.higherValue!.input).toEqual({ ...base, hourly: 300 + EARNINGS_HOURLY_STEP });
    for (const scenario of scenarios) {
      expect(scenario.monthly).toBeCloseTo(monthlyProjection(scenario.input)!, 6);
    }
  });

  it("omite cenário que sai da faixa válida", () => {
    const ids = buildEarningsScenarios({ hourly: EARNINGS_HOURLY_STEP, contacts: 1, days: 7 }).map(
      (scenario) => scenario.id,
    );
    expect(ids).toEqual(["fewerDays", "higherValue"]);
    expect(buildEarningsScenarios({ hourly: 0, contacts: 1, days: 1 })).toEqual([]);
  });
});

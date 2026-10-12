import { useMemo, useState } from "react";
import {
  EARNINGS_DEFAULT_INPUT,
  buildEarningsScenarios,
  evaluateEarningsGoal,
  monthlyProjection,
  yearlyProjection,
  type EarningsGoal,
  type EarningsScenarioId,
} from "@sigillus/domain";

function toNumber(value: string): number {
  return value === "" ? Number.NaN : Number(value);
}

export function useEarningsSimulator(initialGoal: EarningsGoal = "reserve3") {
  const [hourly, setHourly] = useState(String(EARNINGS_DEFAULT_INPUT.hourly));
  const [contacts, setContacts] = useState(String(EARNINGS_DEFAULT_INPUT.contacts));
  const [days, setDays] = useState(String(EARNINGS_DEFAULT_INPUT.days));
  const [goal, setGoalState] = useState<EarningsGoal>(initialGoal);
  const [customValue, setCustomValue] = useState("");
  const [scenarioId, setScenarioId] = useState<EarningsScenarioId>("moreDays");

  const input = useMemo(
    () => ({ hourly: toNumber(hourly), contacts: toNumber(contacts), days: toNumber(days) }),
    [hourly, contacts, days],
  );
  const monthly = monthlyProjection(input);
  const yearly = yearlyProjection(input);
  const scenarios = useMemo(() => buildEarningsScenarios(input), [input]);
  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0] ?? null;
  const parsedCustom = customValue === "" ? null : Number(customValue);
  const goalResult =
    monthly === null ? null : evaluateEarningsGoal({ goal, monthly, customValue: parsedCustom });

  const setGoal = (next: EarningsGoal) => {
    if (next !== goal) {
      setCustomValue("");
    }
    setGoalState(next);
  };

  return {
    hourly,
    contacts,
    days,
    setHourly,
    setContacts,
    setDays,
    goal,
    setGoal,
    customValue,
    setCustomValue,
    scenarioId,
    setScenarioId,
    monthly,
    yearly,
    scenarios,
    scenario,
    goalResult,
  };
}

export type EarningsSimulatorState = ReturnType<typeof useEarningsSimulator>;

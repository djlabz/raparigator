export const EARNINGS_WEEKS_PER_MONTH = 4.33;
export const EARNINGS_MONTHS_PER_YEAR = 12;
export const EARNINGS_MAX_DAYS_PER_WEEK = 7;
export const EARNINGS_HOURLY_STEP = 50;
export const EARNINGS_HOURLY_MIN = 50;
export const EARNINGS_HOURLY_MAX = 9999;
export const EARNINGS_CONTACTS_MIN = 1;
export const EARNINGS_CONTACTS_MAX = 20;
export const EARNINGS_DAYS_MIN = 1;
export const EARNINGS_DEFAULT_INPUT: EarningsSimulatorInput = { hourly: 300, contacts: 4, days: 5 };

export type EarningsSimulatorInput = {
  hourly: number;
  contacts: number;
  days: number;
};

export type EarningsGoal = "reserve3" | "reserve6" | "customAmount" | "customDeadline";

export const EARNINGS_GOALS: ReadonlyArray<{ id: EarningsGoal; label: string }> = [
  { id: "reserve3", label: "Reserva de 3 meses" },
  { id: "reserve6", label: "Reserva de 6 meses" },
  { id: "customAmount", label: "Valor que eu definir" },
  { id: "customDeadline", label: "Prazo que eu definir" },
];

export type EarningsScenarioId = "fewerDays" | "moreDays" | "lowerValue" | "higherValue";

export type EarningsScenario = {
  id: EarningsScenarioId;
  label: string;
  input: EarningsSimulatorInput;
  monthly: number;
};

export type EarningsGoalResult = {
  target: number;
  months: number;
};

function isPositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isValidEarningsInput(input: EarningsSimulatorInput): boolean {
  return (
    isPositive(input.hourly) &&
    isPositive(input.contacts) &&
    isPositive(input.days) &&
    input.days <= EARNINGS_MAX_DAYS_PER_WEEK
  );
}

export function monthlyProjection(input: EarningsSimulatorInput): number | null {
  if (!isValidEarningsInput(input)) {
    return null;
  }
  return input.hourly * input.contacts * input.days * EARNINGS_WEEKS_PER_MONTH;
}

export function yearlyProjection(input: EarningsSimulatorInput): number | null {
  const monthly = monthlyProjection(input);
  return monthly === null ? null : monthly * EARNINGS_MONTHS_PER_YEAR;
}

export function reserveTarget(monthly: number, months: number): number {
  return monthly * months;
}

export function monthsToReach(target: number | null, monthly: number): number | null {
  if (!isPositive(target) || !isPositive(monthly)) {
    return null;
  }
  return Math.ceil(target / monthly);
}

export function amountForDeadline(months: number | null, monthly: number): number | null {
  if (!isPositive(months) || !isPositive(monthly)) {
    return null;
  }
  return months * monthly;
}

export function evaluateEarningsGoal({
  goal,
  monthly,
  customValue,
}: {
  goal: EarningsGoal;
  monthly: number;
  customValue: number | null;
}): EarningsGoalResult | null {
  switch (goal) {
    case "reserve3":
    case "reserve6": {
      if (!isPositive(monthly)) {
        return null;
      }
      const months = goal === "reserve3" ? 3 : 6;
      return { target: reserveTarget(monthly, months), months };
    }
    case "customAmount": {
      const months = monthsToReach(customValue, monthly);
      return months === null || customValue === null ? null : { target: customValue, months };
    }
    case "customDeadline": {
      const target = amountForDeadline(customValue, monthly);
      return target === null || customValue === null ? null : { target, months: customValue };
    }
  }
}

export function buildEarningsScenarios(input: EarningsSimulatorInput): EarningsScenario[] {
  if (!isValidEarningsInput(input)) {
    return [];
  }
  const candidates: Array<Omit<EarningsScenario, "monthly">> = [
    { id: "fewerDays", label: "Um dia a menos", input: { ...input, days: input.days - 1 } },
    { id: "moreDays", label: "Um dia a mais", input: { ...input, days: input.days + 1 } },
    {
      id: "lowerValue",
      label: "Valor por hora menor",
      input: { ...input, hourly: input.hourly - EARNINGS_HOURLY_STEP },
    },
    {
      id: "higherValue",
      label: "Valor por hora maior",
      input: { ...input, hourly: input.hourly + EARNINGS_HOURLY_STEP },
    },
  ];
  return candidates.flatMap((candidate) => {
    const monthly = monthlyProjection(candidate.input);
    return monthly === null ? [] : [{ ...candidate, monthly }];
  });
}

import { EARNINGS_GOALS } from "@sigillus/domain";
import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";
import { OptionGroup } from "./option-group";
import type { EarningsSimulatorState } from "./use-earnings-simulator";

function formatMonths(months: number) {
  return months === 1 ? "1 mês" : `${months} meses`;
}

export function GoalsSection({ state }: { state: EarningsSimulatorState }) {
  const { goal, goalResult } = state;
  const isCustom = goal === "customAmount" || goal === "customDeadline";
  const customLabel = goal === "customAmount" ? "Valor da meta (R$)" : "Prazo da meta (meses)";

  return (
    <Card className="space-y-3 p-4 md:p-5">
      <OptionGroup
        name="earnings-goal"
        legend="Meta"
        options={EARNINGS_GOALS}
        value={goal}
        onChange={state.setGoal}
      />
      {isCustom ? (
        <div className="space-y-1">
          <label htmlFor="earnings-goal-custom" className="text-xs font-medium text-zinc-700">
            {customLabel}
          </label>
          <input
            id="earnings-goal-custom"
            data-testid="earnings-goal-custom"
            type="text"
            inputMode="numeric"
            value={state.customValue}
            onChange={(event) => state.setCustomValue(event.target.value.replace(/\D/g, ""))}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 focus:border-wine-300 focus:outline-none focus:ring-2 focus:ring-wine-100"
          />
        </div>
      ) : null}
      {goalResult ? (
        <div data-testid="earnings-goal-result" className="rounded-xl bg-zinc-50 p-3 text-sm">
          {goal === "customDeadline" ? (
            <p className="text-zinc-700">
              Em {formatMonths(goalResult.months)}, com a projeção atual:{" "}
              <span className="font-semibold text-zinc-900">{currency(goalResult.target)}</span>
            </p>
          ) : (
            <p className="text-zinc-700">
              Meta de{" "}
              <span className="font-semibold text-zinc-900">{currency(goalResult.target)}</span>:
              com a projeção atual, {formatMonths(goalResult.months)}
            </p>
          )}
        </div>
      ) : isCustom ? (
        <p className="text-xs text-zinc-500">
          {goal === "customAmount"
            ? "Informe o valor para ver o prazo."
            : "Informe o prazo para ver o valor."}
        </p>
      ) : null}
    </Card>
  );
}

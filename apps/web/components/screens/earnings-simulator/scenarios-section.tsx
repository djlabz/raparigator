import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";
import { OptionGroup } from "./option-group";
import type { EarningsSimulatorState } from "./use-earnings-simulator";

export function ScenariosSection({ state }: { state: EarningsSimulatorState }) {
  const { monthly, scenario, scenarios } = state;
  if (monthly === null || scenarios.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-3 p-4 md:p-5">
      <OptionGroup
        name="earnings-scenario"
        legend="Comparar com outro cenário"
        options={scenarios}
        value={scenario?.id ?? null}
        onChange={state.setScenarioId}
      />
      {scenario ? (
        <dl
          data-testid="earnings-scenario-result"
          className="grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 p-3 text-sm"
        >
          <div>
            <dt className="text-xs text-zinc-500">Projeção atual por mês</dt>
            <dd className="font-semibold text-zinc-900">{currency(monthly)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">{scenario.label}, por mês</dt>
            <dd className="font-semibold text-zinc-900">{currency(scenario.monthly)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-zinc-500">Diferença por mês</dt>
            <dd className="font-semibold text-zinc-900">
              {currency(Math.abs(scenario.monthly - monthly))}
            </dd>
          </div>
        </dl>
      ) : null}
    </Card>
  );
}

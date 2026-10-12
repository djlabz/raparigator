import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";
import type { EarningsSimulatorState } from "./use-earnings-simulator";

export function ProjectionSection({ state }: { state: EarningsSimulatorState }) {
  if (state.monthly === null || state.yearly === null) {
    return (
      <p className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        Confira os valores: use números positivos e no máximo 7 dias por semana.
      </p>
    );
  }

  return (
    <section aria-label="Projeção" className="grid grid-cols-2 gap-3">
      <Card className="p-4">
        <p className="text-xs font-medium text-zinc-500">Projeção por mês</p>
        <p
          data-testid="earnings-projection-month"
          className="mt-1 text-lg font-bold text-zinc-900 md:text-2xl"
        >
          {currency(state.monthly)}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs font-medium text-zinc-500">Projeção por ano</p>
        <p
          data-testid="earnings-projection-year"
          className="mt-1 text-lg font-bold text-zinc-900 md:text-2xl"
        >
          {currency(state.yearly)}
        </p>
      </Card>
    </section>
  );
}

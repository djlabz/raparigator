import type { EarningsGoal } from "@sigillus/domain";
import { GoalsSection } from "./goals-section";
import { HowWeCalculate } from "./how-we-calculate";
import { InputsSection } from "./inputs-section";
import { ProjectionSection } from "./projection-section";
import { ScenariosSection } from "./scenarios-section";
import { useEarningsSimulator } from "./use-earnings-simulator";

export const EARNINGS_NO_PAYMENT_TEXT =
  "100% do valor do seu atendimento é seu. A plataforma não participa de nenhum pagamento.";
export const EARNINGS_DISCLAIMER_TEXT = "Simulação. Não representa garantia de renda.";

export function EarningsSimulator({ initialGoal }: { initialGoal?: EarningsGoal }) {
  const state = useEarningsSimulator(initialGoal);

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-4">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-zinc-900 md:text-2xl">Simulador de projeção</h1>
        <p className="text-sm font-medium text-zinc-800">{EARNINGS_NO_PAYMENT_TEXT}</p>
        <p className="text-xs text-zinc-500">{EARNINGS_DISCLAIMER_TEXT}</p>
      </header>
      <InputsSection state={state} />
      <ProjectionSection state={state} />
      <ScenariosSection state={state} />
      <GoalsSection state={state} />
      <HowWeCalculate />
    </div>
  );
}

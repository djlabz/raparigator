export function HowWeCalculate() {
  return (
    <details className="group rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
      <summary className="cursor-pointer font-semibold text-zinc-900">Como calculamos</summary>
      <div className="mt-2 space-y-2">
        <p>
          Valor por hora × contatos por dia × dias por semana × 4,33 semanas = projeção por mês.
        </p>
        <p>Projeção por ano = 12 × projeção por mês.</p>
        <p>
          As metas usam 100% da projeção por mês, sem descontar gastos, impostos, juros ou inflação.
          Os cenários mudam um dia por semana ou R$ 50 no valor por hora.
        </p>
      </div>
    </details>
  );
}

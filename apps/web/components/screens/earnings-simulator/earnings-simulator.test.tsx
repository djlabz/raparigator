import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EarningsSimulator } from "@/components/screens/earnings-simulator/earnings-simulator";

const NO_PAYMENT_TEXT =
  "100% do valor do seu atendimento é seu. A plataforma não participa de nenhum pagamento.";
const DISCLAIMER_TEXT = "Simulação. Não representa garantia de renda.";

function visibleText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

describe("EarningsSimulator", () => {
  const html = renderToString(<EarningsSimulator />);
  const text = visibleText(html);

  it("não compara com CLT, milhão, liberdade nem conquistas", () => {
    expect(html).not.toMatch(/CLT/);
    expect(html).not.toMatch(/milh[aã]o/i);
    expect(html).not.toMatch(/Liberdade/);
    expect(html).not.toMatch(/conquista/i);
    expect(html).not.toMatch(/Topo das Pesquisas/);
    expect(html).not.toMatch(/mensal/i);
  });

  it("não usa emoji", () => {
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("mostra as duas frases obrigatórias", () => {
    expect(text).toContain(NO_PAYMENT_TEXT);
    expect(text).toContain(DISCLAIMER_TEXT);
  });

  it("oferece as quatro metas", () => {
    for (const label of [
      "Reserva de 3 meses",
      "Reserva de 6 meses",
      "Valor que eu definir",
      "Prazo que eu definir",
    ]) {
      expect(text).toContain(label);
    }
  });

  it("mostra projeção por mês, por ano e o Como calculamos", () => {
    expect(text).toContain("Projeção por mês");
    expect(text).toContain("Projeção por ano");
    expect(html).toMatch(/<details[^>]*>/);
    expect(text).toContain("Como calculamos");
  });

  it("campo livre nasce vazio", () => {
    const customHtml = renderToString(<EarningsSimulator initialGoal="customAmount" />);
    const input = customHtml.match(/<input[^>]*data-testid="earnings-goal-custom"[^>]*>/)?.[0];
    expect(input).toBeDefined();
    expect(input).toMatch(/\svalue=""/);
  });
});

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SummaryTab } from "@/components/screens/professional-dashboard/summary-tab";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined, prefetch: () => undefined }),
  usePathname: () => "/profissional/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

function visibleText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

describe("SummaryTab", () => {
  const text = visibleText(renderToString(<SummaryTab />));

  it("sem dado real da API não mostra nenhum número", () => {
    expect(text).not.toMatch(/\d/);
  });

  it("não mostra variação nem comparativo inventados", () => {
    expect(text).not.toMatch(/[↑↓]/);
    expect(text).not.toMatch(/mês anterior/i);
    expect(text).not.toMatch(/Tráfego e Descoberta/);
  });
});

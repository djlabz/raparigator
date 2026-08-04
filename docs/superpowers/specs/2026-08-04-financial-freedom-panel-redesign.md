# Painel de Liberdade Financeira — Redesign de Densidade e Impacto

## Context

A tela `/popular/independencia-financeira` (`FinancialIndependenceScreen`) tem dois estados: calculadora e painel de resultados. No mobile a calculadora fica carregada de texto e o CTA compete com a tab bar flutuante. No desktop o conteúdo fica em coluna estreita (`max-w-4xl`) com muito espaço em branco — especialmente após calcular. Explicações de cálculo ficam expostas no rodapé. O objetivo do painel é gerar FOMO claro: “caramba, olha o que estou deixando de lado”.

## Decisões de produto

| Eixo | Escolha |
|---|---|
| Clima emocional | Impacto forte / FOMO (números grandes, contraste emerald vs cinza CLT) |
| Layout do painel (desktop) | Hero sticky + grid denso abaixo |
| Calculadora | Preview ao vivo + formulário compacto |
| Hero no mobile | Sticky completo → após 1º scroll encolhe para barra fina |
| Abordagem visual | “Choque de realidade” (não ticker nem split antes/depois) |

## Escopo

- Arquivo principal: `components/screens/financial-independence-screen.tsx`
- Página: `app/(public)/popular/independencia-financeira/page.tsx` (só se precisar de metadata)
- Novo primitivo local ou em `components/ui`: `InfoHint` (botão ⓘ + popover animado)
- Ajustes de densidade no `Counter` interno da screen
- Testes Playwright de fluxo e responsividade
- Fora de escopo: mudança nas fórmulas de cálculo, backend, novos planos Premium, troca de libs de ícone/animação

## Arquitetura da experiência

### Estado A — Calculadora

1. Header curto: título + uma linha de subtítulo
2. Formulário compacto (3 steppers obrigatórios + meta de tempo opcional + unidade)
3. Preview vivo entre inputs e CTA
4. CTA full-width: “Ver meu Painel da Liberdade”
5. Sem parágrafo de fórmula no rodapé — só ⓘ

### Estado B — Painel

1. Toggle “Topo das Pesquisas” (Premium) no topo
2. Hero de impacto (manchete + montante)
3. Grid de métricas: Corrida do Milhão, Equivalência, Linha do Tempo das Conquistas
4. “Nova Simulação” discreto (no hero colapsado no mobile; canto do hero no desktop)
5. Explicações só via ⓘ

## Layout responsivo

### Mobile (< 768px)

- Coluna única densa: paddings menores, `space-y` reduzido, steppers `h-10`
- CTA com padding-bottom suficiente para não ficar sob a tab bar flutuante
- Hero sticky no topo; após o primeiro scroll relevante, colapsa para barra fina:
  - Conteúdo da barra: `{N} anos · R$ XX.XXX` + ação compacta de nova simulação
- Conquistas em grid 2×2

### Desktop (≥ 768px)

- Container `max-w-5xl` para eliminar a sensação de “coluna magra” sem esticar demais
- Hero sticky no topo da área de conteúdo enquanto o grid rola
- Grid do painel em 2 colunas onde fizer sentido (Corrida + Equivalência lado a lado; Conquistas em 4 cols)
- Sem buraco branco grande entre nav e hero: reduzir `pt`/gaps do topo do painel

## Calculadora — preview vivo

Bloco entre inputs e CTA, atualizado quando os valores válidos mudam:

- Linha 1 (destaque): `≈ {currency(monthlyRevenue)} / mês`
- Linha 2 (secundária, tom emerald/wine): `~{yearsSaved} anos a menos que o ritmo CLT`
- Se inputs inválidos: preview some ou mostra estado neutro
- Meta de tempo opcional continua opcional; preview mensal não depende dela
- ⓘ no preview explica a base do cálculo e a comparação CLT

## Hero sticky (painel)

### Conteúdo expandido

- Manchete: “Você está comprando **{yearsSaved} anos** da sua vida de volta.”
- Montante: valor projetado + label do período (1 mês padrão se meta vazia)
- Microcopy curta; textos longos de método vão para ⓘ

### Comportamento

- Desktop: `position: sticky` no topo da coluna de conteúdo
- Mobile: sticky expandido → após scroll, anima para barra compacta
- Motion com spring nos números; collapse suave; respeitar `prefers-reduced-motion`
- Z-index abaixo de modais/tab bar, acima do conteúdo do grid

## Componente InfoHint

- Botão circular com ícone Lucide (`Info` ou `CircleHelp`)
- Clique abre popover (mobile e desktop); fecha em outside click, ESC e ao abrir outro ⓘ
- Animação: fade + scale (Motion / AnimatePresence)
- Acessível: `aria-expanded`, `aria-controls`, foco no disparo
- Conteúdos em PT-BR simples (sem jargão):

| Onde | Texto sugerido |
|---|---|
| Cálculo base | Multiplicamos valor × atendimentos × dias × 4,33 semanas do mês. |
| Comparação CLT | Usamos o salário mínimo líquido (descontos de INSS e VT) como ritmo padrão de comparação. |
| Montante | Projeção do seu ritmo atual nesse período. |
| Corrida do Milhão | Tempo estimado para juntar R$ 1 milhão no seu ritmo vs no ritmo CLT. |
| Equivalência | Quantos meses de um salário CLT equivalem a 1 mês no seu ritmo. |
| Conquistas | Tempo estimado para cada meta mantendo o ritmo simulado. |
| Topo das Pesquisas | Simula o efeito da visibilidade Premium nos seus números. |

## Visual / FOMO

- Seu ritmo: emerald forte (números, barras, destaques)
- Ritmo CLT: cinza apagado / opacidade reduzida
- Tipografia: Manrope no UI; `font-display` (Cormorant) só se reforçar a manchete sem quebrar hierarquia existente
- Cores de marca wine nos CTAs; gold apenas no contexto Premium já existente
- Evitar clutter: remover captions redundantes que o ⓘ já cobre
- Densidade: cards `p-4`/`p-5`, gaps menores que o atual `space-y-6` uniforme

## Componentes e estrutura

- Extrair `InfoHint` reutilizável (preferência: `components/ui/info-hint.tsx`)
- Manter lógica de cálculo em `useMemo` na screen (sem mudar fórmulas)
- Subcomponentes locais opcionais (`CalculatorForm`, `FreedomHero`, `FreedomMetricsGrid`) se o arquivo passar de ~500–600 linhas — só se ajudar a leitura
- Não introduzir novos tipos em `lib/types.ts` salvo necessidade real compartilhada
- Sem comentários no código

## Dados e estados

Estados existentes preservados: inputs, `submitted`, `topSearchBoost`, `upsellOpen`, `projectionTime`/`projectionUnit`.

Novos estados de UI:

- `infoOpenId: string | null` — qual ⓘ está aberto
- `heroCollapsed: boolean` — mobile collapse (derivado de scroll observer)

Preview e painel consomem o mesmo `parsed` do `useMemo`.

## Erros e edge cases

- Inputs inválidos no submit: EmptyState atual mantido
- Preview: não mostrar “anos salvos” negativos ou NaN; clamp/guard no render
- `yearsSaved === 0`: copy alternativa (“Você já está no ritmo — refine os números”) sem quebrar o hero
- Um ⓘ aberto por vez
- Reduced motion: popover e collapse sem spring exagerado

## Validação (Playwright)

Cobrir em viewports **375**, **768** e **1280** (e smoke em modo navegação com tab bar visível no mobile):

1. Alterar steppers → preview atualiza
2. Clicar CTA → painel renderiza com manchete e montante
3. Desktop: hero permanece visível ao rolar o grid (sticky)
4. Mobile: após scroll, hero colapsa para barra fina com número principal
5. Clicar ⓘ → popover aparece; fora/ESC fecha; segundo ⓘ troca o aberto
6. CTA da calculadora não fica coberto pela tab bar
7. “Nova Simulação” volta ao formulário
8. Toggle Premium continua atualizando números / upsell

Usar Playwright do projeto (`npm run test:e2e` / testes em `tests/`) e, na validação ad hoc de motion/UI, a skill `refine-motion` com MCP Playwright — sem misturar MCP e fallback na mesma run.

## Critérios de aceite

- Mobile da calculadora mais denso, sem texto de fórmula exposto
- Desktop sem “largadão”: hero colado no topo útil, grid aproveitando largura
- FOMO legível em < 3 segundos (anos + montante)
- Todas as explicações de cálculo atrás de ⓘ com animação
- Responsividade e fluxo validados via Playwright nos viewports acima
- `npm run lint` passa ao finalizar a implementação

## Fora desta entrega

- Alterar constantes TARGET / MIN_WAGE / fórmulas
- Redesign global do AppShell ou da tab bar
- Persistência da simulação entre sessões

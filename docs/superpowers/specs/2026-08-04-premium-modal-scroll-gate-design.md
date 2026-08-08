# Premium Conversion Modal — scroll gate no passo Comparar

## Problema

No `PremiumConversionModal`, o footer com **Continuar para assinatura** fica fixo e a área de conteúdo rola por trás. O `Modal` esconde a scrollbar. No mobile, o passo **2 · Comparar** parece “completo” com os cards Comum/Premium, e o usuário clica Continuar sem ver o bloco de planos/preço abaixo.

## Decisão

No passo 2 apenas: hint visual **fade suave + seta** enquanto houver conteúdo abaixo, e o CTA permanece com o texto **Continuar para assinatura** mas fica **desabilitado** até o usuário rolar até perto do fim (ou até não haver overflow).

## Comportamento

1. Ao entrar no passo 2, se o conteúdo não cabe na área de scroll → CTA desabilitado + fade branco na base da área rolável + `ChevronDown` centrado com bounce leve.
2. Ao chegar perto do fim (~16–24px do bottom) → fade/seta somem e o CTA habilita.
3. Se não há overflow → CTA já nasce habilitado, sem hint.
4. Texto do botão não muda entre estados.
5. **← Ver benefícios** permanece sempre clicável.
6. Ao voltar do passo 1 → 2, ou reabrir o modal, o gate reseta (scroll no topo; CTA travado de novo se houver overflow).
7. Passo 1 (Benefícios) não usa gate nem hint.

## Visual do hint

- Gradient branco `transparent → white`, altura ~48–56px, na base da área de scroll.
- ChevronDown (Lucide), cor zinc média, bounce leve (~1.2s).
- `pointer-events: none` para não bloquear o scroll.
- Some com transição curta quando `canScrollDown` fica falso.

## Arquitetura

### `Modal` (`components/ui/modal.tsx`)

Dono do `scrollRef`. Expõe (opcional, default off — outros modais inalterados):

- `onScrollAvailabilityChange?: (state: { canScrollDown: boolean; reachedEnd: boolean }) => void`
- `showScrollHint?: boolean`

Medição: listener de `scroll` + `ResizeObserver` no container (e/ou no conteúdo) para recalcular overflow após troca de step/layout. Threshold de fim ~16–24px.

Quando `showScrollHint && canScrollDown`, renderiza o overlay fade + chevron sobre a base da área de scroll.

### `ShinyButton` (`components/ui/shiny-button.tsx`)

- Prop `disabled?: boolean`.
- Sem `whileHover` / `whileTap` quando disabled.
- Aparência atenuada (opacidade ~0.4).
- Não dispara `onClick` quando disabled; `aria-disabled` / `disabled` nativo.

### `PremiumConversionModal` (`components/ui/premium-conversion-modal.tsx`)

- Estado local derivado do callback do Modal (`canScrollDown`, `reachedEnd`).
- `showScrollHint={step === 2 && canScrollDown}`.
- CTA passo 2: `disabled={canScrollDown && !reachedEnd}` (liberado se não há overflow ou se já chegou no fim).
- Antes da primeira medição no passo 2, tratar como possível overflow (CTA desabilitado) para evitar flash de botão liberado; após medir, aplicar a regra real.
- Passo 1 inalterado.

## Fora do escopo

- Gate ou hint no passo 1.
- Mudar o texto do CTA enquanto travado.
- Mostrar scrollbar nativa do modal.
- Refatorar layout dos cards/planos.
- Pill “mais” ou variantes B/C do companion visual.

## Verificação

- `npm run lint` e `npm run check`
- Mobile com overflow no passo 2: hint visível, CTA travado; após scroll até o fim, hint some e CTA libera
- Sem overflow (viewport alto / desktop): CTA liberado de imediato, sem hint
- Passo 1 e demais modais sem regressão visual/comportamental
- Voltar para o passo 2 reseta o gate

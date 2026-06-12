# Design Guidelines - Sigillus Frontend

## Escopo

- Projeto: frontend Next.js da Sigillus, interface `pt-BR`, tom de produto: seguranca, discricao, custodia financeira, experiencia premium.
- Este documento e contexto primario para agentes de IA ao criar ou alterar UI.
- Fonte analisada: `package.json`, `app/globals.css`, `app/layout.tsx`, `postcss.config.mjs`, `next.config.ts`, `app/manifest.ts`, `components/ui/**`, `components/layout/**`, telas publicas/privadas representativas e CSS Modules existentes.

## Stack De Estilizacao

- Framework: Next.js App Router (`next@16`, React 19, TypeScript).
- Estilo primario: Tailwind CSS v4 com `@import "tailwindcss"` e tokens em `@theme inline` dentro de `app/globals.css`.
- PostCSS: `@tailwindcss/postcss`.
- Componentizacao: React components + classes Tailwind em `className`.
- Composicao de classes: helper local `cn(...values)` em `lib/utils.ts`; nao ha `clsx`, `tailwind-merge` ou variantes formais tipo CVA.
- Icones: `lucide-react` esta instalado e deve ser preferido para novos icones quando houver equivalente.
- Imagens: `next/image` deve ser usado para imagens de produto, capas, galeria e assets estaticos relevantes.
- Animacao: `motion` / `motion/react` usado em controles especificos; CSS animations globais existem para microinteracoes.
- CSS secundario permitido:
  - CSS Modules em telas com hero/visual altamente especifico: `components/screens/onboarding-screen/*.module.css`, `components/screens/professional-signup-screen/*.module.css`.
  - `style jsx` pontual em componente local quando Tailwind nao resolve bem escopo tecnico, ex.: scrollbar do `Modal`.
  - CSS global apenas para tokens, reset minimo, helpers compartilhados e animacoes reutilizaveis.

## Tokens Globais

```css
:root {
  --background: #ffffff;
  --foreground: #121217;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-wine-50: #ffe8ee;
  --color-wine-100: #ffd2de;
  --color-wine-200: #ffacc2;
  --color-wine-300: #ff7ba1;
  --color-wine-500: #d93a6a;
  --color-wine-600: #c2184f;
  --color-wine-700: #b60031;
  --color-wine-800: #920027;
  --font-sans: var(--font-manrope);
  --font-display: var(--font-cormorant);
}
```

- Background base: `#ffffff`; app shell privado/publico operacional usa `bg-zinc-50`.
- Foreground base: `#121217`; texto principal usa `text-zinc-900`.
- Marca/acento principal: escala `wine`; preferir `wine-700` para CTA ativo, `wine-800` hover, `wine-50/100/200/300` para superfices suaves, bordas e foco.
- Manifest/PWA: `theme_color` = `#b60031`.
- Neutros estruturais: familia Tailwind `zinc` domina bordas, fundos, labels e texto secundario.
- Estados:
  - Sucesso/disponivel: `emerald-50/100/200/400/500/700/800`.
  - Alerta/em atendimento: `amber-50/200/300/400/700/800`.
  - Erro/perigo: `red-50/200/500/600/700/800`.
  - Indisponivel/neutro: `zinc-100/200/400/600/700/900`.
- Premium contextual: preto/grafite + dourado apenas para cards/perfis/selos premium, nao como tema global.
  - Grafite recorrente: `#121212`, `#0a0a0a`, `#2a2a2a`.
  - Dourado recorrente: `#FFDF00`, `#DAA520`, `#BF953F`, `#FCF6BA`, `#B38728`, `#a88222`.

## Tipografia

- Fonte sans global: Manrope via `next/font/google`, CSS var `--font-manrope`, Tailwind `font-sans`.
- Fonte display: Cormorant Garamond pesos `500`, `600`, `700`, CSS var `--font-cormorant`, Tailwind `font-display`.
- `body`: Manrope, `antialiased`, texto `foreground`.
- Uso recomendado:
  - `font-sans`: UI operacional, formularios, navegacao, labels, cards, listas, dashboards.
  - `font-display`: marca `Sigillus`, nomes de perfis, titulos editoriais/premium, pontos de luxo controlados.
- Hierarquia comum:
  - Titulo de tela: `text-2xl font-semibold|font-extrabold text-zinc-900`.
  - Titulo de card/secao: `text-base|text-lg font-semibold text-zinc-900`.
  - Label: `text-sm font-medium text-zinc-700`.
  - Texto secundario: `text-sm text-zinc-600` ou `text-xs text-zinc-500`.
  - Eyebrow operacional: `text-xs font-semibold uppercase tracking-[0.18em-0.24em] text-zinc-500`.
- Evitar `font-display` em textos longos, inputs, controles densos e areas administrativas.

## Layout E Espacamento

- Mobile-first; usar breakpoints Tailwind (`sm`, `md`, `lg`, `xl`, `2xl`).
- Shell padrao de app:

```tsx
<div className="min-h-screen bg-zinc-50">
  <main className="mx-auto w-full max-w-7xl px-4 pt-6 pb-20 sm:px-6 lg:max-w-430 lg:px-8 md:pb-10" />
</div>
```

- Conteineres recorrentes:
  - App: `mx-auto w-full max-w-7xl ... lg:max-w-430`.
  - Landing/public hero: `max-w-384 mx-auto px-6 md:px-12`.
  - Form/auth estreito: `mx-auto max-w-md`.
  - Fluxos medium: `mx-auto grid max-w-5xl gap-6`.
- Gaps padrao:
  - Tela: `space-y-6`.
  - Secoes/cards: `space-y-4`, `gap-4`, `gap-6`.
  - Inline controls: `gap-2`, `gap-3`.
- Padding padrao:
  - Card comum: `p-4`.
  - Card/form importante: `p-5`, `p-6`, responsivo `sm:p-5`, `md:p-7`, `lg:p-8`.
  - Inputs/buttons: alturas fixas `h-9`, `h-10`, `h-11`, `h-12`.
- Padroes de grid:
  - Feed: `grid gap-6 lg:grid-cols-[280px_1fr]`.
  - Conteudo + resumo lateral: `lg:grid-cols-[1fr_320px]`.
  - Cards de metricas: `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`.
- Estabilidade: use dimensoes fixas ou constraints em cards de feed, modais, botoes de icone e thumbs (`aspect-*`, `h-*`, `w-*`, `min-h-*`, `max-w-*`) para evitar layout shift.

## Bordas, Raios E Sombras

- Raio padrao de superficie: `rounded-2xl`.
- Raio de controles:
  - Button: `rounded-xl`.
  - Input: `rounded-xl`.
  - Select trigger/dropdown: `rounded-2xl`; option `rounded-xl`.
  - Segmented item: `rounded-lg`.
  - Chips/nav pills/status: `rounded-full`.
  - Modal mobile: `rounded-3xl`; desktop: `sm:rounded-2xl`.
- Bordas padrao: `border border-zinc-200`; divisores `border-zinc-100` ou `border-zinc-200`.
- Superficies principais: `bg-white`, `bg-zinc-50`, ocasional `bg-zinc-100`.
- Sombras:
  - Card base: `shadow-sm shadow-zinc-200/70`.
  - Nav/card ativo: `shadow-sm` ou `shadow-md`.
  - Modal/dropdown: `shadow-xl`, `shadow-[0_24px_60px_rgba(15,23,42,0.18)]`.
  - Hero/landing ou premium: `shadow-2xl`, sombras arbitrarias escuras/douradas somente quando visual premium exige.
- Evitar sombra pesada em dashboards densos; use borda + `shadow-sm`.

## Componentes UI Obrigatorios

- Antes de criar primitive novo, verificar e reutilizar:
  - `components/ui/button.tsx`
  - `components/ui/card.tsx`
  - `components/ui/modal.tsx`
  - `components/ui/select.tsx`
  - `components/ui/switch.tsx`
  - `components/ui/input.tsx`
  - `components/ui/info-banner.tsx`
  - `components/ui/status-badge.tsx`
  - `components/ui/segmented-control.tsx`
  - `components/ui/skeleton.tsx`
  - `components/ui/toast.tsx`
  - `components/ui/empty-state.tsx`

### Button

```tsx
<Button variant="primary" size="md" fullWidth>Confirmar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="ghost">Editar</Button>
<Button variant="danger">Remover</Button>
```

- Variants reais:
  - `primary`: `bg-wine-700 text-white hover:bg-wine-800`.
  - `secondary`: `bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50`.
  - `ghost`: transparente, `text-zinc-700`, hover `bg-zinc-100`.
  - `danger`: `bg-red-600 text-white hover:bg-red-700`.
- Tamanhos: `sm h-9`, `md h-11`, `lg h-12`.
- Todo botao interativo precisa de estado disabled coerente (`disabled:cursor-not-allowed disabled:opacity-60`) e foco visivel.

### Inputs E Selects

```tsx
<Input id="phone" label="Telefone" type="tel" hint="Usado apenas para contato seguro." />
<Select id="method" label="Forma de pagamento" options={[{ value: "pix", label: "Pix" }]} />
```

- Inputs: `h-11`, `rounded-xl`, `border-zinc-200`, `placeholder:text-zinc-400`, foco `focus:border-wine-600 focus:ring-2 focus:ring-wine-200`.
- Select custom: combobox acessivel com portal; usar para dropdowns visiveis no produto em vez de `<select>` nativo cru.
- Labels sempre visiveis; hints/erros em `text-xs`.
- Erro: borda/foco red (`border-red-500 focus:border-red-600 focus:ring-red-200`).

### Card, InfoBanner, EmptyState, Toast

```tsx
<Card className="space-y-4">...</Card>
<InfoBanner tone="secure" title="Pagamento em custodia" description="..." />
<EmptyState title="Nada encontrado" description="Ajuste os filtros." />
<Toast type="success" title="Salvo" message="Alteracoes aplicadas." />
```

- `Card`: base branca com borda zinc; adicionar `space-y-*` no uso, nao embutir regra de negocio no primitive.
- `InfoBanner`: usar para mensagens de seguranca, custodia, destaque e explicacoes curtas.
- `EmptyState`: borda tracejada, fundo zinc, acao secundaria opcional.
- `Toast`: tons `success`, `error`, `info`; manter `role="status"` e `aria-live="polite"`.

## Navegacao E Shell

- Usar `AppShell` para telas dentro da experiencia principal.
- `TopHeader`: sticky, `bg-white/95`, `backdrop-blur`, borda inferior zinc, marca `font-display text-wine-800`.
- `DesktopNav`: sticky sob header, pills `rounded-full`, ativo `bg-wine-700 text-white`.
- `BottomNav`: mobile fixed glass pill; ativo circular `bg-wine-700 text-white`.
- Para novas navegacoes, usar `useAuthSession`, `getNavigationItems` e papeis existentes antes de criar rotas/menus paralelos.
- Nao assumir protecao real de backend em area privada; design pode separar visualmente, mas copy nao deve prometer seguranca inexistente.

## Imagens E Media

- Usar `next/image` para:
  - fotos de anuncio/perfil;
  - hero images;
  - galeria;
  - assets estaticos com dimensoes conhecidas.
- Dominios remotos permitidos em `next.config.ts`: `picsum.photos`, `images.unsplash.com`, `images.pexels.com`.
- Hero publico atual usa imagem real/local com overlay escuro, nao gradiente abstrato.
- Cards de anuncio dependem de imagem como conteudo principal; preservar `object-cover`, overlays legiveis e `sizes`.
- Galerias usam aspect ratio (`aspect-3/4`) e hover leve.

## Tratamento Premium

- Premium e excecao visual deliberada; usar apenas para:
  - anuncio premium no feed;
  - header/perfil premium;
  - cards de destaque premium;
  - assinatura/experiencia de luxo diretamente relacionada.
- Linguagem premium:
  - Fundo escuro `#121212`/preto.
  - Borda dourada sutil.
  - Gradientes dourados em selo/texto curto.
  - `font-display` para nome artistico.
  - Glow/destaque leve e sombras escuras.
  - Interacao 3D/glare existente via classes globais `perspective-1000`, `preserve-3d`, `premium-*`.
- Nao aplicar preto/dourado em dashboards operacionais, formularios comuns, checkout ou componentes globais.
- Evitar duplicar estilo premium inline; se repetir em mais de dois locais, extrair componente/constante local.

## Animacao E Microinteracoes

- Transicoes comuns: `transition`, `transition-colors`, `transition-all duration-200/300`.
- Hover operacional: mudanca de fundo/borda/cor; elevar levemente apenas cards clicaveis de descoberta (`hover:-translate-y-1`).
- Active: `active:scale-[0.97-0.98]` em cards/botoes tacteis quando apropriado.
- Animacoes globais existentes:
  - `.field-shake`: erro de campo, `280ms`.
  - `.message-sent-pop`: envio de mensagem, `320ms`.
  - `.premium-card-wrapper`, `.premium-glare-effect`, `.premium-gold-glow`: interacao premium.
- Respeitar `prefers-reduced-motion` em CSS customizado novo.
- Nao introduzir animacoes longas, decorativas ou que prejudiquem discricao do produto.

## Arquitetura De Estilos

- Padrao principal: Tailwind utilities diretamente nos componentes.
- Condicionais: usar `cn()` com strings simples.

```tsx
className={cn(
  "rounded-2xl border bg-white p-4",
  active ? "border-wine-200 bg-wine-50/70 shadow-sm" : "border-zinc-200 hover:border-zinc-300",
)}
```

- Tokens globais ficam em `app/globals.css`; adicionar token novo somente se for reutilizavel e coerente com marca.
- CSS Modules:
  - Permitido para layout/hero complexo com variaveis CSS, media queries especificas ou visual impossivel de manter legivel em Tailwind.
  - Nao usar CSS Module para card/form simples.
- Inline `style`:
  - Permitido para variaveis dinamicas, posicoes calculadas, largura/progresso, transforms interativos.
  - Evitar para cores, spacing, tipografia e estados quando Tailwind cobre.
- `style jsx`:
  - Usar apenas para escopo tecnico pontual, ex.: scrollbar de componente.
- Nao adicionar styled-components, Emotion, Sass, CSS-in-JS ou outro sistema de estilo sem decisao registrada.

## Acessibilidade E UX

- Componentes interativos precisam de foco visivel (`focus-visible:ring-*` ou equivalente).
- Botoes de icone precisam de `aria-label` e/ou `title` quando nao houver texto visivel.
- Modal deve manter `role="dialog"` e `aria-modal="true"`; overlay fecha com acao explicita.
- Toast deve manter `role="status"` e `aria-live="polite"`.
- Inputs/selects devem ter `label` associado e mensagens de erro/hint visiveis.
- Texto sobre imagem precisa de overlay suficiente (`from-black/*`, `drop-shadow`, contraste alto).
- Evitar copy longa dentro de cards pequenos; dashboards devem priorizar escaneabilidade.
- Manter portugues do Brasil, sem anglicismos desnecessarios em labels visiveis.

## Regras Estritas

- Usar Tailwind v4 e tokens existentes; nao criar paleta paralela.
- Usar `wine` para marca/CTA/foco; nao substituir por vermelho generico salvo erro/perigo.
- Usar `zinc` para estrutura neutra; nao misturar `slate/gray/neutral` sem motivo local forte.
- Reutilizar primitives de `components/ui/**` antes de criar componentes novos.
- Usar `lucide-react` para novos icones quando houver equivalente; evitar novos SVGs inline extensos.
- Usar `next/image` para imagens de produto/remotas quando aplicavel.
- Preservar fontes globais Manrope e Cormorant Garamond; nao alterar `app/layout.tsx` sem tarefa explicita.
- Preservar `DISABLE_HMR === "true"` em `next.config.ts`.
- Manter UI em `pt-BR`.
- Manter tom: seguro, discreto, premium, financeiro/custodia quando relevante.
- Para rotas em `app/**`, manter pages pequenas e delegar UI para `components/screens/**`.
- Para `components/ui/**`, nao importar mocks, sessao, rotas de produto ou regra de negocio.
- Para layout/navigation, consultar `useAuthSession` e `getNavigationItems`.
- Para `components/screens/professional-dashboard/**`, ler `types.ts` e `use-profile-form.ts` antes de alterar fluxo de anuncio.
- Executar `npm run lint` antes de concluir mudancas de codigo quando Node/npm estiverem disponiveis; executar `npm run build` para mudancas em rotas, metadata, config, tipos globais ou comportamento compartilhado.

## Anti-Patterns

- Nao criar redesign global, trocar paleta, fontes ou shell sem tarefa explicita.
- Nao usar preto/dourado premium como tema default.
- Nao usar gradientes decorativos genericos, blobs/orbs ou visual marketing em telas operacionais.
- Nao criar landing page quando a tarefa pede tela/app/fluxo funcional.
- Nao colocar cards dentro de cards; prefira secoes, grids e cards individuais.
- Nao usar sombras fortes como substituto de hierarquia em dashboard; use espacamento, borda e tipografia.
- Nao criar botoes customizados quando `Button` atende.
- Nao criar inputs/selects customizados paralelos quando `Input`/`Select` atendem.
- Nao esconder label de formulario em placeholder.
- Nao depender apenas de cor para estado; combine texto, badge, iconografia ou label.
- Nao usar valores hex arbitrarios para marca quando token `wine-*` existe.
- Nao adicionar bibliotecas de UI/estilo novas sem ADR ou decisao duravel.
- Nao colocar DOM/browser APIs em modulos sem `"use client"`.
- Nao versionar segredos, URLs privadas, credenciais reais ou preferencias pessoais.

## Exemplos De Composicao Recomendada

### Tela Operacional

```tsx
<AppShell>
  <div className="space-y-6">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Financeiro</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Controle de caixa e repasses</h1>
    </div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Receita do mes</p>
        <p className="mt-1 text-2xl font-semibold text-zinc-900">R$ 0,00</p>
      </Card>
    </section>
  </div>
</AppShell>
```

### Formulario Seguro

```tsx
<Card className="space-y-4">
  <Select id="method" label="Forma de pagamento" options={paymentOptions} />
  <InfoBanner
    tone="highlight"
    title="Pagamento em custodia"
    description="O valor fica protegido na Sigillus e so e liberado apos confirmacao."
  />
  <Button fullWidth>Confirmar e pagar</Button>
</Card>
```

### Estado Selecionado

```tsx
className={cn(
  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
  selected
    ? "border-wine-700 bg-wine-700 text-white"
    : "border-zinc-200 bg-white text-zinc-700 hover:border-wine-300 hover:bg-wine-50",
)}
```

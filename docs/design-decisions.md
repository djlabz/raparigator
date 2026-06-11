# Design Decisions — Sigillus (Raparigator)

Este documento registra as principais decisões de design, identidade visual e padrões de interface adotados no projeto.

---

## 1. Identidade Visual e Temática

**Estética Dark & Premium**
- O projeto adota primariamente uma estética "Dark Mode" utilizando tons de `zinc` (ex: `zinc-900`, `zinc-950`) para o fundo principal, passando uma imagem de exclusividade, discrição e luxo (Sigillus).
- Elementos de contraste e chamadas para ação utilizam a paleta `wine` (tons de vinho/bordô), que traz sofisticação e elegância.

**Cores Base (Tailwind & Globals.css)**
- **Fundo principal (Zinc):**
  - `zinc-950` (`#09090b`) — Utilizado como cor principal de fundo na maioria das telas para a estética "Dark Premium".
  - `zinc-900` (`#18181b`) — Utilizado em modais, cards, ou barras de navegação (headers/sidebars) para criar profundidade e distinção em relação ao fundo.
- **Textos (Zinc):**
  - `zinc-100` (`#f4f4f5`) — Texto primário, títulos principais e valores de destaque.
  - `zinc-400` (`#a1a1aa`) — Texto secundário, descrições, sub-textos e labels padrão.
  - `zinc-500` (`#71717a`) — Texto terciário, pequenos avisos, timestamps ou placeholders.
- **Bordas e divisores (Zinc):**
  - `zinc-800` (`#27272a`) — Utilizado puro ou com transparência (ex: `zinc-800/60`) para dividir seções suavemente sem gerar alto contraste.
- **Destaques / Accent (Wine):**
  A paleta `wine` é customizada em `globals.css` e serve como cor de ação, interatividade e identidade do produto.
  - `wine-50` (`#ffe8ee`) a `wine-300` (`#ff7ba1`) — Variações mais claras. Pouco utilizadas diretamente, a não ser como brilhos/glow.
  - `wine-500` (`#d93a6a`) — **Cor Primária**. Botões de ação principal, ícones ativos, e focos de atenção cruciais.
  - `wine-600` (`#c2184f`) / `wine-700` (`#b60031`) — Estados de hover para botões ou elementos primários.
  - `wine-800` (`#920027`) / `wine-900` — Fundos de badges ou botões secundários estilizados, frequentemente utilizados com transparência (ex: `bg-wine-900/40`) para criar áreas de atenção de forma sutil.
- *Importante:* Não utilizar cores genéricas padrão (como `red-500`, `blue-500` para botões principais), a não ser para estados semânticos específicos (sucesso, erro, warning).

## 2. Tipografia

- O projeto utiliza fontes modernas sans-serif definidas pelo Next.js (`next/font`).
- **Títulos (Display):** Pesos maiores (Bold/Black), frequentemente usando tracking ajustado.
- **Microcopy (Tags, Badges, Labels):** Uso frequente de `text-[10px]` ou `text-[11px]`, em maiúsculas (`uppercase`), com espaçamento entre letras (`tracking-widest` ou `tracking-[0.2em]`) e peso `font-black` ou `font-bold` (ex: labels de formulário, pequenas tags de status).

## 3. Padrões de Layout

**Telas de Autenticação (Login/Cadastro)**
- Layout "Split-Panel" (tela dividida): Metade da tela com o formulário de ação (fundo escuro `zinc-950`), metade com uma imagem de impacto de alta qualidade ocupando todo o espaço (usando `object-cover`), passando um ar editorial e aspiracional ("Join the Experience").

**Painel Administrativo**
- **Sidebar:** Fixa (`h-screen sticky top-0`), com menus agrupados ("Principal", "Usuários", "Moderação").
- **Cards e Containers:** Uso intensivo de bordas sutis (`border-zinc-800/60`), fundos levemente transparentes ou ligeiramente mais claros que o fundo principal (`bg-zinc-900/60`), e cantos arredondados generosos (`rounded-2xl` ou `rounded-xl`).
- **Glassmorphism:** Uso moderado de desfoque (`backdrop-blur`) em overlays, modais e tooltips.

## 4. Componentes e Interações

**Ícones e Feedback Visual**
- **Ícones:** Biblioteca padrão `lucide-react`. Tamanhos comuns: `h-4 w-4` ou `h-5 w-5`.
- **Animações (Micro-interações):** Transições suaves utilizando classes do Tailwind (`transition-all duration-200` ou `duration-300`). Efeitos de hover alterando opacidade, cor de borda, ou escala (ex: `hover:scale-105` em imagens de cards de profissionais). O `framer-motion` (`motion`) é utilizado para transições de página ou modais complexos.
- **Botões:** Arredondados (`rounded-xl` ou `rounded-lg`), com padding confortável (ex: `px-4 py-2.5`), font-weight médio a semibold.

**Modais**
- Fundo escuro semitransparente com blur (`bg-black/70 backdrop-blur-sm`).
- Container centralizado e restrito (`max-w-md`), seguindo os tokens de card (`rounded-2xl border border-zinc-800 bg-zinc-900`).

## 5. Moderação e Semântica de Cores (Status)

Sempre que representar status no painel, deve-se usar as seguintes convenções de cor, combinando ícone, borda, fundo com transparência e texto:
- **Aprovado / Ativo / Resolvido:** Emerald (`emerald-400`, `emerald-900/30`) + Ícone de check.
- **Pendente:** Amber (`amber-400`, `amber-900/30`) + Ícone de relógio.
- **Em análise:** Blue (`blue-400`, `blue-900/30`) + Ícone de olho.
- **Recusado / Suspenso:** Red (`red-400`, `red-900/30` ou `red-950/20`) + Ícone de X ou alerta. Ao suspender um card de profissional, a foto recebe o filtro `grayscale`.
- **Arquivado / Neutro:** Zinc (`zinc-400` ou `zinc-500`, `zinc-800/60`).

---
*Nota: Este documento deve ser consultado antes de desenvolver qualquer nova interface, garantindo que o design system (que é uma hard constraint do projeto) seja estritamente respeitado.*

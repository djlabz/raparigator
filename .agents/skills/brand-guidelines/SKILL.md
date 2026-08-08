---
name: brand-guidelines
description: Applies Sigillus (Raparigator) official brand colors and typography to any UI, screen, component, or artifact that should follow the platform's look-and-feel. Use it when brand colors, style guidelines, visual formatting, or design standards apply.
---

# Sigillus Brand Styling

## Overview

Use esta skill para acessar a identidade visual oficial do Sigillus (projeto Raparigator) ao criar ou editar telas, componentes, mockups ou qualquer artefato visual do projeto.

**Keywords**: branding, identidade visual, brand colors, cores da marca, tipografia, typography, Sigillus, Raparigator, visual formatting, design standards, wine, dourado, premium

## Brand Guidelines

### Cores

**Cores principais (paleta wine — tokens Tailwind em `app/globals.css`):**

- `wine-50`: `#ffe8ee` — fundos sutis e estados de destaque leve
- `wine-100`: `#ffd2de` — fundos de hover e chips
- `wine-200`: `#ffacc2` — bordas e elementos secundários
- `wine-300`: `#ff7ba1` — realces suaves
- `wine-500`: `#d93a6a` — anéis de foco (focus ring)
- `wine-600`: `#c2184f` — variação intermediária de destaque
- `wine-700`: `#b60031` — **cor primária** (botões, CTAs, links de marca)
- `wine-800`: `#920027` — hover/active do primário e títulos de marca

**Neutros:**

- Foreground: `#121217` — texto principal
- Background: `#ffffff` — fundo padrão
- Escala `zinc` do Tailwind — textos secundários, bordas e fundos neutros

**Acentos premium (dourado — usados em anúncios/planos premium):**

- Gold: `#DAA520` — bordas, selos e detalhes premium
- Gold Bright: `#FFDF00` — títulos e ícones premium sobre fundo escuro
- Gradiente ouro: `#BF953F` → `#FCF6BA` → `#B38728` — textos com `bg-clip-text` em selos premium
- Fundo premium: `#121212` com bordas `#2a2a2a` — superfícies escuras de contexto premium

**Cores de apoio:**

- WhatsApp: `#25D366` · Telegram: `#229ED9` — exclusivas de botões de contato
- Sucesso: `#10b981` — confirmações e feedback positivo

### Tipografia

- **Display/Títulos**: Cormorant Garamond (pesos 500, 600, 700) — classe `font-display`, fallback serif
- **Corpo**: Manrope — classe `font-sans` (padrão do body), fallback sans-serif
- **Nota**: as fontes são carregadas via `next/font/google` em `app/layout.tsx` e expostas como `--font-cormorant` e `--font-manrope`; não instale fontes nem adicione `<link>` de fontes externas

## Features

### Aplicação de tipografia

- Use `font-display` em títulos de marca, headings de destaque e logotipo textual (ex.: "Sigillus")
- Corpo de texto não precisa de classe — Manrope já é o padrão do `body`
- Preserve a hierarquia existente: `font-display` + `text-2xl`/`text-3xl` para títulos, `text-sm`/`text-base` para corpo

### Aplicação de cores

- Contexto padrão (claro): primário `wine-700`, hover `wine-800`, foco `wine-500`, texto `zinc-900`/foreground
- Contexto premium (escuro): fundo `#121212`, acentos dourados (`#DAA520`, `#FFDF00`, gradiente ouro)
- Escolha a cor de texto conforme o fundo: foreground sobre claro, `#faf...`/branco ou dourado sobre escuro
- Nunca misture o dourado premium com a paleta wine no mesmo componente sem necessidade — o dourado sinaliza conteúdo premium

### Componentes e tokens

- Prefira os tokens Tailwind (`bg-wine-700`, `text-wine-800`, `ring-wine-500`) a valores hex arbitrários
- Reutilize os primitivos de `components/ui` (ex.: `Button` já implementa as variantes de marca)
- Cantos arredondados generosos (`rounded-xl`, `rounded-2xl`) e sombras suaves são parte da linguagem visual

## Technical Details

### Gestão de tokens

- Fonte de verdade das cores: bloco `@theme inline` em `app/globals.css` (Tailwind CSS v4)
- Novas cores compartilhadas devem virar token `--color-*` no `@theme`, nunca hex espalhado pelos componentes
- As variáveis `--font-sans` e `--font-display` já mapeiam Manrope e Cormorant Garamond

### Gestão de fontes

- Fontes servidas pelo `next/font/google` (self-hosted pelo Next.js) — sem requisições externas em runtime
- Fallbacks automáticos: serif para display, sans-serif para corpo
- Não instale outra lib de ícones ou animação: o projeto usa Lucide React e Motion

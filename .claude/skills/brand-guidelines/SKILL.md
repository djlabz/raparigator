---
name: brand-guidelines
description: Aplica as cores e a tipografia oficiais do Sigillus (Raparigator) a qualquer artefato que se beneficie do look-and-feel da marca. Use quando o assunto envolver cores da marca, guia de estilo, formatação visual ou padrões de design do projeto.
---

# Identidade Visual Sigillus

## Visão Geral

Para acessar a identidade visual oficial e os recursos de estilo do Sigillus (frontend Raparigator), use esta skill.

**Palavras-chave**: branding, identidade visual, styling, cores da marca, tipografia, Sigillus, Raparigator, formatação visual, design visual, wine, premium

## Diretrizes de Marca

### Cores

**Cores Principais:**

- Dark: `#121217` (`--foreground`) - Texto primário e fundos escuros
- Light: `#ffffff` (`--background`) - Fundos claros e texto sobre fundo escuro
- Neutros: escala `zinc` do Tailwind - `zinc-900` para títulos, `zinc-600`/`zinc-500` para texto secundário, `zinc-400` e mais claros para elementos sutis

**Paleta Wine (cor primária da marca):**

- `wine-50`: `#ffe8ee` - Fundos sutis de destaque
- `wine-100`: `#ffd2de` - Fundos suaves e badges
- `wine-200`: `#ffacc2` - Bordas e hovers claros
- `wine-300`: `#ff7ba1` - Elementos decorativos
- `wine-500`: `#d93a6a` - Acento intermediário
- `wine-600`: `#c2184f` - **Acento primário** (botões, links, CTAs)
- `wine-700`: `#b60031` - Hover do acento primário e ênfase forte
- `wine-800`: `#920027` - Estados pressionados e fundos escuros de marca

**Cores de Apoio (escalas Tailwind):**

- Emerald (`emerald-500`/`emerald-600`) - Sucesso, confirmações e status positivos
- Red (`red-500`/`red-600`) - Erros, alertas e ações destrutivas
- Amber (`amber-400`/`amber-500`) - Contexto premium/dourado (planos, destaques VIP)

**Efeitos Premium (dourado):**

- Glow: `rgba(184, 134, 11, 0.12)` a `rgba(218, 165, 32, 0.22)` em box-shadows
- Glare: `rgba(255, 223, 0, 0.25)` em gradientes radiais

### Tipografia

- **Títulos/Display**: Cormorant Garamond, pesos 500-700 (com Georgia/serif como fallback) - classe `font-display`
- **Corpo de Texto**: Manrope (com sans-serif como fallback) - classe `font-sans`, padrão do `body`
- **Nota**: As fontes são carregadas via `next/font/google` em `app/layout.tsx` e expostas como `--font-cormorant` e `--font-manrope`

## Recursos

### Aplicação Inteligente de Fontes

- Aplica Cormorant Garamond (`font-display`) a títulos de destaque, heros e números de impacto
- Aplica Manrope a todo o corpo de texto, labels e componentes de UI
- Fallback automático para serif/sans-serif do sistema se as fontes não carregarem
- Preserva a legibilidade em todos os dispositivos

### Estilização de Texto

- Títulos de destaque: `font-display` com pesos 500-700
- Corpo de texto: Manrope com hierarquia via escala `zinc` (900 → 500)
- Seleção inteligente de cor conforme o fundo (texto `zinc-900` em fundo claro, `zinc-100`/branco em fundo escuro)
- Preserva a hierarquia e a formatação do texto

### Formas e Cores de Acento

- Elementos interativos primários usam `wine-600` com hover `wine-700`
- Fundos de destaque sutis usam `wine-50`/`wine-100`
- Estados semânticos ciclam entre emerald (sucesso), red (erro) e amber (premium)
- Mantém o interesse visual sem sair da identidade da marca

## Detalhes Técnicos

### Gestão de Fontes

- Usa as variáveis `--font-manrope` e `--font-cormorant` definidas no `RootLayout`
- Mapeadas no Tailwind v4 via `@theme inline` como `--font-sans` e `--font-display`
- Não requer instalação manual - `next/font` faz o self-hosting automaticamente
- Nunca importe fontes por `<link>` ou `@import` - sempre via `next/font`

### Aplicação de Cores

- Tokens da paleta wine definidos em `app/globals.css` dentro de `@theme inline`
- Sempre use as classes utilitárias do Tailwind (`bg-wine-600`, `text-wine-700`, `border-wine-200`) em vez de valores hexadecimais soltos
- Novas variações de cor da marca devem ser adicionadas como tokens em `app/globals.css`, nunca hardcoded nos componentes
- Neutros sempre pela escala `zinc` - não misture `gray`, `slate`, `stone` ou `neutral`

# Visitante: offset sticky dos filtros sem DesktopNav

## Problema

No feed desktop, visitante não tem `DesktopNav` (`navigationByRole.visitor = []`). O painel de Filtros ainda usa `chromeBelowDesktopNavStickyTop` / `MaxH` (~9rem), pensados para header + faixa da nav. Resultado: faixa cinza vazia entre o header e o card de filtros.

## Decisão

Corrigir só o layout (opção A). Sem CTA no lugar da nav e sem nav mínima de visitante.

## Comportamento

| Estado | Sticky dos filtros (desktop `lg+`) |
|--------|-------------------------------------|
| Nav desktop presente | Continua ~9rem (header + faixa da nav) |
| Nav desktop ausente | ~5rem (só header), alinhado a `chromeDesktopNavSticky` |
| Mobile / `< lg` | Sem mudança (filtros em modal / aside oculto) |

Regra de “nav presente” — a mesma do `AppShell`:

`!hideDesktopNav && getNavigationItems(role).length > 0`

## Implementação

1. Em `lib/chrome-styles.ts`, adicionar tokens abaixo do header:
   - `chromeBelowHeaderStickyTop` → `top-[calc(5rem+env(safe-area-inset-top,0px))]`
   - `chromeBelowHeaderStickyMaxH` → `max-h-[calc(100dvh-5rem-env(safe-area-inset-top,0px)-1.5rem)]`

2. Em `components/screens/feed-screen/feed-screen.tsx`, no sticky do painel de filtros, escolher o par header vs below-nav conforme a regra acima (via `useAuthSession` + `getNavigationItems` + `useShellChrome().hideDesktopNav` se necessário).

3. Painel profissional (`professional-dashboard-screen`) permanece com os tokens below-nav: usuário profissional sempre tem itens de navegação.

## Fora de escopo

- CTA ou placeholder no lugar da DesktopNav
- Itens de navegação para role `visitor`
- Alterar bottom nav mobile
- Refatorar `ShellChrome` / CSS variables globais (desnecessário para este fix)

## Verificação

- Desktop visitante no `/feed`: sem faixa vazia; filtros grudam sob o header
- Desktop logado (cliente/profissional): filtros alinham abaixo da pill, como hoje
- Mobile: comportamento inalterado
- `npm run lint`

# Desktop Nav Header Slot & Page Action Widgets — Design Spec

## Contexto

Após mover o menu de navegação de abas (`DesktopNav` contendo Feed, Chat, Painel) para o lado esquerdo no desktop, criou-se uma grande faixa horizontal vazia à direita do menu no topo do `AppShell`. Isso desperdiça espaço de tela relevante, especialmente em páginas de aplicação como **Chat** (`/chat`) e **Painel Profissional** (`/painel`).

No **Feed**, o layout atual atende bem e deve permanecer inalterado.

## Objetivos

1. Estender o layout da barra de navegação desktop do `AppShell` com um slot à direita (`desktopNavRight`).
2. Preencher a faixa superior em `/chat` com controles rápidos de disponibilidade do profissional e filtros de conversas.
3. Preencher a faixa superior em `/painel` com o status de publicação do anúncio, métrica diária de visualizações e atalho para o anúncio público.
4. Manter o **Feed** (`/`) intacto (sem renderizar nenhum elemento à direita, preservando o alinhamento atual).

## Escopo

### Modificações de Componentes
- `components/layout/app-shell.tsx`:
  - Adicionar a prop opcional `desktopNavRight?: React.ReactNode`.
  - Atualizar o wrapper do `DesktopNav` para usar um container Flex (`flex items-center justify-between gap-4 mb-4 hidden md:flex`).
  - Exibir `desktopNavRight` à direita quando fornecido.
- `components/screens/chat-screen.tsx`:
  - Montar o widget de topo do Chat com:
    1. Selector de status com luz LED (*🟢 Disponível / 🟠 Ocupado / ⚪ Indisponível*).
    2. Filtros rápidos de conversa (*Todas / Não Lidas*).
  - Passar esse widget para a prop `desktopNavRight` do `<AppShell>`.
- `components/screens/professional-dashboard/professional-dashboard-screen.tsx`:
  - Montar o widget de topo do Painel Profissional com:
    1. Badge compacto de status do anúncio (*🟢 Anúncio Ativo* ou *🔴 Pausado*).
    2. Contador de acessos (*👁️ 142 visualizações hoje*).
    3. Botão discreto *"Ver meu anúncio público"* (link direto para `/anuncio/[slug]`).
  - Passar esse widget para a prop `desktopNavRight` do `<AppShell>`.

### Inalterados
- `components/screens/feed-screen/feed-screen.tsx`: Permanece invocando `<AppShell>` sem `desktopNavRight`.
- Comportamento mobile (telas < 768px): Não afetado, pois a barra `DesktopNav` é oculta em telas menores (`hidden md:flex`).

## Detalhamento Técnico & Componentes

### 1. `AppShell` (`components/layout/app-shell.tsx`)
```tsx
interface AppShellProps extends PropsWithChildren {
  // ...props existentes
  desktopNavRight?: React.ReactNode;
}
```
Estrutura da renderização no `AppShell`:
```tsx
{!hideDesktopNav && navigationItems.length > 0 ? (
  <div className="mb-4 hidden items-center justify-between gap-4 md:flex">
    <DesktopNav items={navigationItems} />
    {desktopNavRight ? (
      <div className="flex items-center gap-3 shrink-0">
        {desktopNavRight}
      </div>
    ) : null}
  </div>
) : null}
```

### 2. Widget do Chat (`components/screens/chat-screen.tsx`)
- Container estilizado no padrão glassmorphism/pill Sigillus: `inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white/90 px-3 py-1.5 shadow-xs backdrop-blur-sm`.
- **Selector de Disponibilidade:** Dropdown ou pílula interativa para alterar `availabilityStatus` rapidamente com indicador LED animado (`bg-emerald-500`, `bg-amber-500`, `bg-zinc-400`).
- **Filtro de Mensagens:** Pílulas ou segmented-control compacto (*Todas* / *Não lidas*).

### 3. Widget do Painel Profissional (`components/screens/professional-dashboard/professional-dashboard-screen.tsx`)
- Container no mesmo padrão visual elegante (`rounded-full border border-zinc-200 bg-white/90 px-3.5 py-1.5 shadow-xs flex items-center gap-4 text-xs font-semibold`).
- **Status Badge:** Pílula colorida indicando estado do anúncio (*Ativo*).
- **Métricas:** Texto discreto `👁️ 142 views hoje`.
- **Atalho do Anúncio:** Botão pílula secundário com ícone de link externo redirecionando para `/anuncio/${adSlug}` em nova aba.

## Verificação & Validação
- `npm run lint`: Verificar se não há avisos/erros de ESLint ou TypeScript.
- `npm run build`: Verificar compilação da aplicação sem erros.
- Verificação visual responsiva no Desktop (≥768px) e Mobile (<768px).

# Arquitetura — raparigator-front-nextjs

> Snapshot da arquitetura atual. Atualizar sempre que uma decisão estrutural for tomada.
> Última atualização: 2026-06-09

---

## Visão geral

Frontend Next.js 16 (App Router) com React 19 e TypeScript. Interface de uma plataforma de acompanhantes, com fluxos de autenticação, feed de anúncios, chat interno, perfil profissional e painel de conta.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + TypeScript |
| Estilo | Tailwind CSS v4 + `app/globals.css` |
| Ícones | lucide-react |
| Animações | motion (Framer Motion) |
| Lint | ESLint 9 + eslint-config-next |

---

## Design system

Definido em `app/globals.css`. Tokens principais:

- **Vinho** (`wine-*`): cor primária da marca — botões, destaques, alertas negativos
- **Zinc** (`zinc-*`): cor neutra — backgrounds, bordas, textos secundários
- **Emerald** (`bg-emerald-500`): status online
- **Fonte**: Inter (Google Fonts), com fallbacks do sistema

> **Constraint**: Não alterar os tokens de cor em `globals.css` como parte de uma feature.

---

## Estrutura de rotas (App Router)

```
app/
├── (public)/                        ← sem proteção de auth
│   ├── page.tsx                     ← landing / home
│   ├── feed/                        ← listagem de anúncios
│   ├── anuncio/[slug]/              ← detalhe do anúncio
│   ├── acompanhamento/              ← rastreamento de serviço
│   ├── popular/                     ← seções populares
│   ├── checkout/                    ← pagamento
│   └── auth/
│       ├── login/
│       └── cadastro/
│           ├── cliente/
│           └── profissional/
│
└── (private)/                       ← exige isLoggedIn (via useAuthSession)
    ├── chat/                        ← chat interno
    ├── conta/                       ← conta do usuário
    └── profissional/                ← painel e dashboard profissional
```

---

## Componentes

### `components/layout/`
| Arquivo | Descrição |
|---|---|
| `app-shell.tsx` | Wrapper de página com header, nav e safe-area |
| `top-header.tsx` | Header desktop |
| `bottom-nav.tsx` | Nav mobile |
| `desktop-nav.tsx` | Nav desktop |
| `account-menu.tsx` | Menu da conta do usuário |

### `components/ui/`
Componentes reutilizáveis: `Button`, `Modal`, `Toast`, `Input`, `Select`, `Switch`, `Card`, `EmptyState`, `Skeleton`, `StatusBadge`, `SegmentedControl`, `StarRatingInput`, `RiskWarningModal`, `ImageBlurModal`, `ImageCropperModal`, `InfoBanner`, `BackButton`.

### `components/screens/`
Um arquivo de screen por feature. Cada screen é um Client Component (`"use client"`).

---

## Camada de dados (`lib/`)

| Arquivo | Descrição |
|---|---|
| `types.ts` | Interfaces compartilhadas: `Conversation`, `Message`, `ProfessionalAd`, `Review`, `MediaHighlight`, `MockUser`, etc. |
| `mock-data.ts` | Dados mock usados pelo chat e feed durante desenvolvimento |
| `chat-service.ts` | Serviço do chat com contratos REST documentados e flag `USE_MOCK` |
| `auth-session.ts` | Hook `useAuthSession` — estado de autenticação mock |
| `mock-users.ts` | Usuários mock para autenticação local |
| `navigation.ts` | Helpers de navegação |
| `utils.ts` | Utilitários gerais (`cn`) |
| `verification.ts` | Lógica de verificação de perfil |
| `profile-completion.ts` | Cálculo de completude de perfil |
| `account-notifications.ts` | Notificações de conta |
| `cropImage.ts` | Utilitário de crop de imagem |

---

## Autenticação (atual — mock)

Gerenciada por `lib/auth-session.ts` via `localStorage`. Hook `useAuthSession()` retorna `{ isLoggedIn, user, login, logout }`.

Rotas privadas verificam `isLoggedIn` dentro da screen e renderizam fallback de bloqueio se falso.

> **Constraint**: Não alterar `lib/auth-session.ts` nem rotas `/auth/*` sem aprovação explícita do time.

---

## Integração com backend (futura)

O backend será integrado pelo outro membro do time. A camada de serviço (`lib/<feature>-service.ts`) foi desenhada para facilitar essa integração:

- Flag `USE_MOCK = true` → dados mock locais
- Flag `USE_MOCK = false` + `NEXT_PUBLIC_API_URL` definida → chamadas reais à API
- Contratos REST completos documentados em comentário em cada função de serviço

Ver `lib/chat-service.ts` como referência de padrão.

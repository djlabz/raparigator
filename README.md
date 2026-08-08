# Raparigator - Frontend

Bem-vindo ao repositório frontend do projeto **Raparigator** (Sigillus). Este projeto foi construído utilizando as tecnologias mais modernas do ecossistema React, focado em performance, design e experiência do usuário (UX).

> **Importante:** ainda não há backend. Todos os dados são mockados em `lib/` (`lib/mock-data.ts`, `lib/mock-users.ts`) — nenhuma variável de ambiente ou API externa é necessária para rodar o projeto.

## 🚀 Tecnologias e Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Biblioteca de Interface:** [React 19](https://react.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animações e Micro-interações:** [Motion](https://motion.dev/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Linguagem:** TypeScript
- **Testes E2E:** [Playwright](https://playwright.dev/)
- **Manipulação de Imagens:** `react-image-crop`

## 📁 Estrutura Principal do Projeto

A arquitetura do frontend foi dividida visando escalabilidade e separação de preocupações de rota.

```
app/
├── (tabs)       # Abas principais com shell persistente (Feed, Chat, Acompanhamento, Painel)
├── (public)     # Rotas abertas (Autenticação, Anúncio, Checkout, Popular)
├── (private)    # Rotas que exigem usuário logado (Conta, Financeiro, Anúncios)
└── (admin)      # Rotas de uso exclusivo de administradores (Backoffice)

components/
├── ui/          # Componentes genéricos e primitivos (Botões, Inputs, Modais)
├── layout/      # Componentes estruturais (Navbar, Footer, Sidebar)
└── screens/     # Componentes e fragmentos maiores que compõem páginas

lib/             # Tipos (types.ts), mocks e serviços (auth-session, chat-service, etc.)
tests/           # Suite E2E Playwright (logins de teste em tests/helpers/credentials.ts)
```

## 🛠 Pré-requisitos

- **Node.js** 20.19+, 22.13+ ou 24+ (ver `engines` no `package.json`)
- `npm` (ou outro gerenciador de pacotes da sua preferência)

## 💻 Como Rodar o Projeto Localmente

1. **Clone o repositório e acesse o diretório:**
   ```bash
   git clone --filter=blob:none https://github.com/djlabz/raparigator.git
   cd raparigator
   ```
   > A flag `--filter=blob:none` baixa apenas os arquivos da versão atual (clone bem mais rápido). Um `git clone` normal também funciona.

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```

4. O aplicativo estará disponível em: [http://localhost:3000](http://localhost:3000)

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o servidor local usando o **Turbopack** para compilação super rápida.
- `npm run dev:legacy`: Inicia o servidor local com o compilador padrão do Next.js.
- `npm run build`: Faz a build otimizada da aplicação para ambiente de produção.
- `npm run start`: Inicia o servidor Node para a versão já compilada pelo `build`.
- `npm run lint`: Checa a qualidade de código utilizando ESLint.
- `npm run typecheck`: Roda o compilador TypeScript sem emitir arquivos.
- `npm run check`: Lint + typecheck (rode antes de abrir PR).
- `npm run test:e2e`: Roda a suite E2E Playwright (Chromium). Variantes: `test:e2e:ui`, `test:e2e:report`.
- `npm run share`: Expõe o `localhost:3000` **publicamente** via túnel Cloudflare (`cloudflared`). Use com cuidado e apenas quando precisar de testes externos.

## 🤝 Diretrizes de Contribuição

1. **Commit Messages**: Procure utilizar padrões semânticos nos commits (ex: `feat:`, `fix:`, `chore:`, `style:`).
2. **Branches**: Evite comitar diretamente na `main`. Crie branches descritivas como `feature/minha-feature` ou `fix/bug-navbar`.
3. Certifique-se de executar o `npm run check` e checar o visual antes de abrir Pull Requests.
4. Mais convenções (e o que nunca fazer) estão no `AGENTS.md`.

---

*Desenvolvido focado em Alta Performance e Interfaces Ricas.*

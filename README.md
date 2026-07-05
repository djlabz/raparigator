# Raparigator - Frontend

Bem-vindo ao repositório frontend do projeto **Raparigator**. Este projeto foi construído utilizando as tecnologias mais modernas do ecossistema React, focado em performance, design e experiência do usuário (UX).

## 🚀 Tecnologias e Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Biblioteca de Interface:** [React 19](https://react.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animações e Micro-interações:** [Motion](https://motion.dev/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Linguagem:** TypeScript
- **Manipulação de Imagens:** `react-image-crop` & `react-easy-crop`

## 📁 Estrutura Principal do Projeto

A arquitetura do frontend foi dividida visando escalabilidade e separação de preocupações de rota.

```
app/
├── (public)     # Rotas abertas (Feed, Autenticação, Anúncios, Checkout, Acompanhamento)
├── (private)    # Rotas que exigem usuário logado (Painéis, Gerenciamento de Perfil)
└── (admin)      # Rotas de uso exclusivo de administradores (Backoffice)

components/
├── ui/          # Componentes genéricos e primitivos (Botões, Inputs, Modais)
├── layout/      # Componentes estruturais (Navbar, Footer, Sidebar)
└── screens/     # Componentes e fragmentos maiores que compõem páginas
```

## 🛠 Pré-requisitos

Certifique-se de ter instalado em sua máquina:
- **Node.js** (versão 20 ou superior)
- Um gerenciador de pacotes da sua preferência (`npm`, `yarn`, `pnpm` ou `bun`).

## 💻 Como Rodar o Projeto Localmente

1. **Clone o repositório e acesse o diretório:**
   ```bash
   # Navegue até o diretório do projeto
   cd raparigator-front-nextjs
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   - Verifique quais variáveis locais de `.env` são necessárias (APIs, tokens, etc). 
   - Crie um arquivo `.env.local` baseado em um `.env.example` (se existente).

4. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   # Com Turbopack (Recomendado para dev rápido)
   npm run dev

   # Sem Turbopack (Legacy)
   npm run dev:legacy
   ```

5. O aplicativo estará disponível em: [http://localhost:3000](http://localhost:3000)

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o servidor local usando o **Turbopack** para compilação super rápida.
- `npm run dev:legacy`: Inicia o servidor local com o compilador padrão do Next.js.
- `npm run build`: Faz a build otimizada da aplicação para ambiente de produção.
- `npm run start`: Inicia o servidor Node para a versão já compilada pelo `build`.
- `npm run lint`: Checa a qualidade de código utilizando ESLint.
- `npm run share`: Script utilitário utilizando o `cloudflared tunnel` para expor o `localhost:3000` publicamente para testes externos (necessita ter o ngrok/cloudflared configurado).

## 📝 Roadmap & TODO

* Melhorar a página de visão do cliente/visitante.
* Desenvolver componente/UI para conversão de contas Premium.
* Implementar gatilhos e *calls-to-action* espalhadas por outras páginas para engajamento em planos Premium.

## 🤝 Diretrizes de Contribuição

1. **Commit Messages**: Procure utilizar padrões semânticos nos commits (ex: `feat:`, `fix:`, `chore:`, `style:`).
2. **Branches**: Evite comitar diretamente na `main`. Crie branches descritivas como `feature/minha-feature` ou `fix/bug-navbar`.
3. Certifique-se de executar o `npm run lint` e checar o visual antes de abrir Pull Requests.

---

*Desenvolvido focado em Alta Performance e Interfaces Ricas.*

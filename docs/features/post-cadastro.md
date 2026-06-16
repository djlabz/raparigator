# Feature Contract — Pós-cadastro e Onboarding

> Status: **em planejamento** · Última atualização: 2026-06-09

---

## Resumo
Ajustar o fluxo de criação de conta (passo 3) tanto para cliente quanto para profissional. Ao finalizar o cadastro, a aplicação simulará um login (`setRole`) e redirecionará o usuário para o próximo passo lógico.

---

## Fluxo Cliente
1. **Ação**: Clicar em "Criar conta" na `client-signup-screen.tsx` ou fazer Login em `login-screen.tsx`.
2. **Resultado interno**: `setRole("cliente")` via `useAuthSession`.
3. **Navegação**: Redirecionamento automático e incondicional para `/feed`.
4. **UX**: Um Toast de sucesso ("Bem-vindo ao Sigillus") no cadastro. O usuário usará a Central de Notificações para ser lembrado de completar o perfil.

---

## Fluxo Profissional
1. **Ação**: Clicar em "Criar conta profissional" na `professional-signup-screen.tsx`.
2. **Resultado interno**: `setRole("profissional")` via `useAuthSession`.
3. **Navegação**: Redirecionamento automático para a rota principal `/profissional/dashboard`.
4. **UX**: O painel (`professional-dashboard-screen.tsx`) exibe um banner orientando: "Configure seu anúncio para começar sua nova independência".

---

## Arquivos a alterar / criar

| Arquivo | Ação |
|---|---|
| `components/screens/client-signup-screen.tsx` | [MODIFICADO] Ligar botão a `setRole("cliente")` e `router.push("/feed")` |
| `components/screens/login-screen.tsx` | [MODIFICADO] Sempre redirecionar para `/feed` ao invés de checar completude do perfil |
| `components/screens/professional-signup-screen/...` | [MODIFICADO] Ligar botão a `setRole("profissional")` e `router.push("/profissional/dashboard")` |
| `components/screens/professional-dashboard/...` | [MODIFICADO] Inserir InfoBanner no topo com aviso para completar o perfil |

---

## Tipos e Mock Data
- Não serão necessários novos tipos, apenas simular a interface de preenchimento dos dados complementares do profissional.

---

## Contrato de API (Futuro)
O backend futuramente fará as requisições para:
- `POST /api/auth/register/client` -> retorna token JWT
- `POST /api/auth/register/professional` -> retorna token JWT
- `PATCH /api/professional/profile` -> Endpoint para receber dados do onboarding

# ADR-019 — Autenticação: duas instâncias do better-auth e campos sensíveis fora do `update-user`

- Status: aceito (2026-11-12), registrando o que a API faz desde a T-11 e a Fase J

## Contexto

A plataforma tem dois públicos com riscos diferentes: usuários (cliente e profissional), que se cadastram sozinhos, e administradores do backoffice, que aprovam anúncios, suspendem contas e veem dados pessoais. O better-auth expõe rotas prontas (`sign-up`, `update-user` e outras) que aceitam no corpo os campos adicionais do usuário, a menos que eles sejam declarados como não editáveis. Papel, CPF, telefone e cidade só podem ser informados no cadastro, e com validação; depois disso, nem eles nem a situação da conta podem ser alterados pelo próprio usuário por essas rotas.

## Opções consideradas

- **Uma instância com papel `admin` no usuário.** Um bug de autorização ou um campo editável a mais promove um usuário a admin; admin e usuário dividiriam cookie, sessão e rate limit.
- **Duas instâncias com tabelas e cookies separados.** Sessão de admin não serve na API de usuário e vice-versa; o admin não tem cadastro aberto.

## Decisão

- **Duas instâncias do better-auth** (`apps/api/src/modules/auth/`):
  - Usuário: `/api/auth`, cookie com prefixo `sigillus`, tabelas `user`, `session`, `account`, `verification`, cadastro aberto, sessão de 30 dias.
  - Admin: `/api/admin-auth`, cookie com prefixo `sigillus-admin`, tabelas `admin_*` próprias, `disableSignUp`, sessão de 12 horas. O primeiro admin é criado pela CLI `admin:create` (`docs/operacao/deploy.md`).
  - Rotas `admin.*` do contrato exigem a sessão da instância de admin: 401 sem sessão e 403 para usuário comum logado (P-26).
- **Campos sensíveis com `input: false`.** `role`, `cpf`, `phone`, `phoneVerified`, `city`, `status` e `suspensionReason` não são aceitos pelo `update-user` nem gravados direto pelo `sign-up`. No cadastro, o hook `databaseHooks.user.create.before` lê papel, CPF, telefone e cidade do corpo, valida e só então grava (`readSignupSensitiveFields`: papel só `cliente` ou `profissional`, nunca admin; CPF validado pelo domain). Essa validação é o limite de segurança do cadastro. Só o `alias` é editável pelas rotas do better-auth, com checagem de disponibilidade.
- **Mudanças depois do cadastro passam pelo contrato:** `auth.updateProfile` (CPF e cidade) e `contactVerification.changePhone` (telefone, que volta a não verificado). Papel e situação da conta só mudam por ação do admin.
- **Rate limit próprio de cada instância** nas rotas de login e cadastro, ligado por `RATE_LIMIT_ENABLED` (ADR-021).
- Cookies `HttpOnly`, `Secure` e `SameSite=Lax`, com domínio compartilhado entre `app.` e `api.` (ADR-007).

## Consequências

- Uma sessão de usuário nunca autentica no backoffice, mesmo que a autorização de um procedimento falhe.
- O web tem dois clients do better-auth (ADR-016) e o `proxy.ts` valida as duas sessões separadamente.
- Campo novo no usuário entra como `input: false` por padrão; ficar editável pelo próprio usuário é decisão explícita.

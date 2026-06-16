# Project Brief

## Produto

Sigillus e uma plataforma frontend em portugues do Brasil para conectar clientes e profissionais com foco em seguranca, discricao, custodia financeira e experiencia premium.

## Arquitetura E Stack

- Consulte **`AGENTS.md`** e **`docs/design-guidelines.md`** para diretrizes estritas sobre stack, configuracao e regras por caminhos da aplicacao.
- Elementos chave do frontend: `lib/types.ts` (tipos de dominio mockado), `lib/mock-data.ts` (dados fake), `lib/auth-session.ts` (sessao no localStorage).

## Papeis

- `visitor`
- `cliente`
- `profissional`

## Rotas Principais

- Publicas: `/`, `/feed`, `/anuncio/[slug]`, `/chat`, `/checkout`, `/acompanhamento`, `/popular/*`, `/auth/*`.
- Privadas: `/conta`, `/profissional/dashboard`, `/profissional/anuncios`, `/profissional/financeiro`.

## Limites Importantes

- A autenticacao atual e mockada e client-side.
- Dados de `lib/mock-users.ts` e `credenciais_mock.txt` nao sao credenciais reais de producao.
- Nao assumir backend, banco, pagamento real ou protecao real de rota sem decisao explicita.

## Pontos De Atencao

- `components/screens/professional-dashboard/announcement-tab.tsx` e grande e deve ser inspecionado sob demanda.
- `next.config.ts` contem regra de ambiente para `DISABLE_HMR`.
- O build ignora ESLint; lint deve ser rodado separadamente.

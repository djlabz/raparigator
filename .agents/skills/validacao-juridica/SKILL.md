---
name: validacao-juridica
description: Checklist jurídico do Sigillus. Use antes de implementar qualquer feature nova que toque anúncio, contato, mídia, pagamento ou dados pessoais; o resultado vai na descrição do PR.
---

# Validação jurídica

Toda feature nova que toque anúncio, contato, mídia, pagamento ou dados pessoais passa por este checklist antes da implementação; o resultado vai na descrição do PR. Origem: T-66 de `docs/correcoes-juridico.md` (a "regra 2 desta fase" é a regra 2 da seção 0 daquele arquivo).

1. **Tese da plataforma:** site de anúncios de autônomas adultas; gratuito; sem intermediação, custódia, cobrança ou registro de pagamento; a plataforma exibe, não organiza.
2. **Linhas que não se cruzam:** nenhuma tela calcula, sugere ou valida preço do atendimento; nenhuma tela registra que um atendimento aconteceu; nenhum valor pago passa pela plataforma; nenhuma comparação com outra profissão; nenhuma parte vê o nome real da outra; nenhuma feature pública de recrutamento de anunciantes.
3. **Checklist por feature (responder sim/não com justificativa):** (a) exibe ou organiza? (b) cria registro do encontro? (c) toca dinheiro? (d) quem vê, logado ou público? (e) coleta dado novo? qual base LGPD? (f) pode alcançar menor? (g) existe no líder do mercado? (h) vocabulário conforme a regra 2 desta fase?
4. **Normas de referência:** CP 228, 229, 230, 218-B, 149-A; ECA 241-A a 241-E; Marco Civil 15, 19, 21 e Tema 987 do STF; Decretos 12.975 e 12.976/2026; LGPD 7, 9, 11, 14, 18, 46, 48.
5. **Resultado:** `APROVADA`, `APROVADA COM AJUSTE` (listar) ou `BLOQUEADA: pergunta ao operador`. Nunca implementar uma `BLOQUEADA`.

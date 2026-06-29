# Open Questions — raparigator-front-nextjs

Perguntas e bloqueios em aberto. Atualizar quando uma pergunta for resolvida ou surgir uma nova.

---

## Template de entrada

```
## [aberta/resolvida] — <título>

**Pergunta**: <o que precisa ser decidido>
**Impacto**: <o que fica bloqueado enquanto isso não for resolvido>
**Resposta**: <preencher quando resolvida>
**Resolvida em**: <data>
```

---

## [aberta] — Regras de autenticação real

**Pergunta**: Qual será o mecanismo de autenticação quando o backend estiver pronto? JWT com refresh token? Cookie httpOnly? OAuth?
**Impacto**: `lib/auth-session.ts` precisará ser substituído. Afeta todas as rotas privadas.
**Resposta**: _Aguardando definição do dev de backend._
**Resolvida em**: —

---

## [aberta] — WebSocket ou polling para mensagens em tempo real

**Pergunta**: O chat usará WebSocket, SSE ou polling para receber novas mensagens?
**Impacto**: Define se precisamos adicionar lógica de subscribe/unsubscribe ao `chat-service.ts` ou a um hook separado.
**Resposta**: _Aguardando definição do dev de backend._
**Resolvida em**: —

---

## [aberta] — Upload real de mídia no chat

**Pergunta**: Qual será o storage de mídia? S3, R2, outro? Qual limite de tamanho de arquivo?
**Impacto**: A função `sendViewOnceMediaMessage` precisará receber um parâmetro `file: File` e fazer upload multipart. A interface do modal de mídia precisará adicionar um `<input type="file">`.
**Resposta**: _Aguardando definição do dev de backend._
**Resolvida em**: —

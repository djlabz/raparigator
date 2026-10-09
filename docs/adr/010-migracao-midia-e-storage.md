# ADR-010 — Migração de Mídia, Upload Pré-assinado e Gestão de Galeria

- Status: aceito (2026-10-08)

## Contexto

A plataforma Sigillus suporta o envio e a gestão de fotos e vídeos da galeria de cada anúncio profissional, além da seleção de imagem de capa e de foto de perfil.

Antes desta task (T-13), o frontend em `apps/web` manipulava o upload de arquivos localmente usando `FileReader` (`readAsDataURL`) com base64 em memória no formulário de anúncio, e os limites de upload (quantidade máxima de fotos e vídeos) dependiam exclusivamente de constantes locais e do estado armazenado no `localStorage`.

Na API, o módulo `media` (`apps/api/src/modules/media/`) e o subsistema de storage (`apps/api/src/lib/storage.ts`) já implementam o contrato completo de mídia:

- `media.createUpload`: cria o registro `media_asset` com status `pending_upload`, valida os limites de plano da profissional (`canUploadMedia`) disparando erro `PLAN_LIMIT` caso a cota seja excedida, e gera uma URL pré-assinada para upload via `PUT` no storage S3/MinIO.
- Upload direto via `fetch(uploadUrl, { method: "PUT", headers, body: file })`: o único `fetch` solto permitido no web, transferindo o arquivo diretamente ao storage sem sobrecarregar a API.
- `media.completeUpload`: valida a presença do arquivo com `storage.head()`, marca status como `processing` e enfileira o job `media.process` no `pg-boss`.
- Job worker (`media.process`): gera thumbnail WebP (480px) com `sharp`, extrai metadados (`width`, `height`), grava a thumbnail no storage e atualiza o asset para status `ready`.
- `media.get`: permite polling até que o asset transite para `ready` ou erro.
- `media.listMine`: lista os assets do usuário autenticado por finalidade (`gallery`, `profile`, `chat`).
- `media.remove`: remove o asset do storage e do banco de dados, desvinculando também da foto de perfil se for o caso.
- `media.reorder`: atualiza as posições da galeria no banco.
- `media.setProfileImage`: vincula o asset `ready` ao `profile.profileImageAssetId`.
- `premium.getState()`: devolve `limits` dinâmicos (`photoLimit`, `videoLimit`, `canSendViewOnce`, `canUseAlias`, `visibilityMultiplier`).

## Decisão

**Implementar o fluxo completo de upload e gestão de mídia no web em dual-mode (`apps/web/lib/announcement-media.ts`, `apps/web/lib/premium-plan.ts` e `apps/web/components/screens/professional-dashboard/announcement-tab.tsx`).**

1. **Procedimentos de Mídia (`apps/web/lib/announcement-media.ts`)**:
   - `uploadMediaFile(file, purpose, onProgress)`: orquestra a chamada de `createUpload`, o `fetch` PUT pré-assinado com os headers retornados pela API, `completeUpload` e polling em `pollMediaUntilReady`.
   - `pollMediaUntilReady(assetId)`: faz polling com backoff de 400ms em `media.get` até o status ser `ready` ou falha.
   - `removeMedia(assetId)`: chama `media.remove({ assetId })`.
   - `reorderMedia(assetIds)`: chama `media.reorder({ assetIds })`.
   - `setProfileImageMedia(assetId)`: chama `media.setProfileImage({ assetId })`.
   - `listMyMedia(purpose)`: busca os assets próprios do usuário via `media.listMine({ purpose })`.
   - `isPlanLimitError(error)`: identifica se o erro retornado pela API possui código `PLAN_LIMIT`.

2. **Limites Dinâmicos do Plano (`apps/web/lib/premium-plan.ts`)**:
   - No modo `api`, consulta `premium.getState()` na API e atualiza a store reativa com `limits` do servidor (`photoLimit`, `videoLimit`, etc.).
   - Utiliza constantes com identidade referencial estável para snapshots do `useSyncExternalStore`, prevenindo loops de re-renderização no React 19.
   - Mantém fallback íntegro para `localStorage` no modo `mock`.

3. **Integração no Painel de Anúncio (`announcement-tab.tsx`)**:
   - `handleAddPhoto`: unifica os gatilhos de upload da galeria bento e do modal fullscreen, executando o pipeline assíncrono de upload na API em modo `api` e tratando erros `PLAN_LIMIT` com aviso ou abertura do modal de conversão.
   - Mapeamento reativo de URLs e thumbnails para `assetId` via `listMyMedia("gallery")`.
   - `deleteMediaAtIndex`: remove o asset do backend via `removeMedia(assetId)` ao deletar foto em modo `api`.
   - `setCoverIndex`: reordena os assets na API via `reorderMedia(assetIds)`.
   - `setProfileIndex` / `updateProfilePreview`: associa a foto de perfil na API via `setProfileImageMedia(assetId)`.
   - Detecção consistente de vídeos (`isVideoSrc`) compatível com base64 mock e extensões de storage de mídia (`.mp4`, `.mov`, `.webm`, `.mkv`).

## Consequências

- Upload de imagens e vídeos da profissional opera 100% integrado ao S3/MinIO e à API quando `NEXT_PUBLIC_DATA_SOURCE=api`.
- Os limites da galeria são governados pelo contrato e pelo plano retornado por `premium.getState()`.
- O modo `mock` permanece totalmente funcional e a suíte Playwright E2E (`gallery-profile-photo.spec.ts` e suíte inteira com 71 testes) permanece 100% verde.
- A próxima task (T-14 — Chat) pode reutilizar os procedimentos de upload de mídia (`uploadMediaFile` com purpose `chat`) para envio de imagens comuns e fotos de visualização única (`sendMedia`).

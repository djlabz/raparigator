# Signup Selection — Mobile Redesign

## Context

A tela de seleção de tipo de conta (`/auth/cadastro`) no mobile atual não exibe a imagem do modelo e empilha os dois cards verticalmente, resultando em uma aparência sem graça. O objetivo é tornar o mobile visualmente atrativo reaproveitando a imagem hero existente.

## Escopo

Apenas o componente `SignupSelectionScreen` (`components/screens/signup-selection-screen.tsx`). Os formulários de cadastro individuais (`cliente/`, `profissional/`) ficam inalterados. O desktop permanece exatamente como está hoje (split panel com imagem à esquerda e cards à direita).

## Duas abordagens

Cada abordagem será implementada em uma branch separada:

- `feature/signup-selection-mobile-A`
- `feature/signup-selection-mobile-C`

---

## Abordagem A — Cards lado a lado com background de imagem

### Layout mobile (< 768px)

- A imagem hero (`persona3-selection-hero.png`) deixa de ser `hidden md:block` e passa a ser exibida como **background da section do formulário**
- A imagem ocupa 100% da section com `object-cover`, mas com `opacity-10` a `opacity-15` mais gradiente escuro por cima, para que o texto leia bem
- `BackButton` mantido na mesma posição
- Grid de cards muda de `grid gap-6` para `grid grid-cols-2 gap-3`
- Cada card perde a descrição longa (`<p className="mb-10 flex-grow...">`) — só mantém:
  - Ícone do topo
  - Título reduzido: "Acessar a Plataforma" / "Anunciar Perfil"
  - CTA "Iniciar" / "Candidatar-se"
- Altura dos cards: `min-h-[200px]` ou similar para não ficarem desproporcionais
- Margens e paddings ajustados para não exigir scroll vertical em telas de ~670px de altura

### Desktop (≥ 768px)

Nenhuma alteração. O layout atual de split panel é preservado.

### Riscos

- Telas muito estreitas (< 360px) podem apertar os dois cards. Mitigação: `gap-2` + `text-sm`.
- Imagem de fundo pode conflitar com a logo/back button visualmente. Mitigação: gradiente forte por cima.

---

## Abordagem C — Full-screen snap scroll com imagem de fundo

### Layout mobile (< 768px)

- Substitui o grid de cards por dois **slides full-screen**
- Container pai com `overflow-y: auto scroll-snap-type: y mandatory`
- Cada slide: `min-h-screen scroll-snap-align: start`, ocupando 100vh
- **Slide 1 (Cliente):**
  - Imagem hero como background full-bleed (`object-cover`)
  - Gradiente escuro sobreposto (de cima e de baixo)
  - Título: "Quero acessar a plataforma"
  - Subtítulo/descrição curta
  - CTA no bottom: "Iniciar Experiência"
- **Slide 2 (Profissional):**
  - Mesma imagem ou uma variação (`persona3-selection-hero.png` serve)
  - Gradiente escuro sobreposto
  - Título: "Quero anunciar meu perfil"
  - CTA no bottom: "Candidatar-se"
- **Navigation dots** indicando posição (slide 1 de 2)
- BackButton no topo do primeiro slide (ou fixo no container)
- Smooth scroll entre slides

### Desktop (≥ 768px)

Nenhuma alteração. Layout atual preservado.

### Riscos

- Usuário pode não perceber que há um segundo slide. Mitigação: dots visíveis + seta sutil indicando "deslize para ver mais".
- Scroll snap pode conflitar com outros comportamentos de scroll em iOS Safari. Mitigação: testar em dispositivo real ou emulador.
- Implementação mais complexa que a Abordagem A.

---

## Checklist de implementação (ambas)

1. Verificar se a imagem `persona3-selection-hero.png` existe em `public/images/personas/persona3/`
2. Editar `components/screens/signup-selection-screen.tsx` com o novo layout mobile
3. Manter `BackButton`, logo e link de login
4. Testar visualmente em: 375×667 (iPhone SE), 390×844 (iPhone 14), 414×896 (iPhone 11 Pro Max)
5. Rodar `npm run lint` e `npm run build` antes de commitar
6. Fazer commit separado por branch (`feature/signup-selection-mobile-A` e `feature/signup-selection-mobile-C`)

## Não escopo

- Alterações nas telas de cadastro individuais (`cliente/`, `profissional/`)
- Alterações no desktop
- Novos assets de imagem
- Testes automatizados (não existem no projeto)

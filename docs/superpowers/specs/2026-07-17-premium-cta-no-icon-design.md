# CTAs premium sem ícone Sparkles

## Problema

O `Sparkles` do Lucide nos CTAs premium (`ShinyButton`, `PremiumEntryButton`) lembra features de IA e compete com a filosofia VIP da Sigillus (exclusividade, discrição, acabamento premium).

## Decisão

Remover o ícone dos CTAs premium. A exclusividade fica no acabamento visual: fundo `#121212`, tipografia `#FFDF00` e borda shiny — sem pictograma à esquerda.

## Escopo

- [`components/ui/shiny-button.tsx`](../../../components/ui/shiny-button.tsx): remover `Sparkles` e o `gap-2` desnecessário; texto centralizado
- [`components/ui/premium-entry-button.tsx`](../../../components/ui/premium-entry-button.tsx): mesma limpeza no rótulo “Desbloquear Premium”

## Fora do escopo

- Trocar por Crown, Gem, Badge ou outro ícone
- Microajustes de tracking/padding
- `Sparkles` decorativos em cards, galeria, modal de benefícios e signup

## Verificação

- `npm run lint`
- Checagem visual: checkout premium (“Confirmar · R$ …”) e painel (“Desbloquear Premium”)

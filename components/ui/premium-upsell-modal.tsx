"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Crown, Images, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ShinyButton } from "@/components/ui/shiny-button";
import { usePremiumPlan } from "@/lib/premium-plan";
import { cn } from "@/lib/utils";

export type PremiumHighlight = "topSearch" | "traffic" | "portfolio" | "media";

interface PremiumUpsellModalProps {
  open: boolean;
  onClose: () => void;
  highlight?: PremiumHighlight;
}

const BENTO_CELLS: Array<{
  id: PremiumHighlight | "badge";
  title: string;
  description: string;
  icon: typeof Crown;
  span: string;
  dark?: boolean;
}> = [
  {
    id: "topSearch",
    title: "Topo das Pesquisas",
    description: "Seu anúncio aparece antes de todos os outros da sua cidade, todos os dias.",
    icon: TrendingUp,
    span: "col-span-2",
    dark: true,
  },
  {
    id: "traffic",
    title: "Tráfego VIP revelado",
    description: "Gráficos completos de visitas, origens e posição na busca.",
    icon: BarChart3,
    span: "col-span-1 row-span-2",
  },
  {
    id: "portfolio",
    title: "Portfólio ilimitado",
    description: "Até 15 fotos e 5 vídeos para mostrar todo o seu trabalho.",
    icon: Images,
    span: "col-span-1",
  },
  {
    id: "media",
    title: "Mídias sem limites",
    description: "Envios ilimitados de mídia de visualização única no chat.",
    icon: Zap,
    span: "col-span-1",
  },
  {
    id: "badge",
    title: "Selo Premium",
    description: "Destaque dourado que transmite confiança e aumenta cliques.",
    icon: Crown,
    span: "col-span-2",
  },
];

export function PremiumUpsellModal({ open, onClose, highlight }: PremiumUpsellModalProps) {
  const { isPremium, activatePremium } = usePremiumPlan();
  const [activated, setActivated] = useState(false);

  const handleClose = () => {
    setActivated(false);
    onClose();
  };

  const handleActivate = () => {
    activatePremium();
    setActivated(true);
    window.setTimeout(handleClose, 1600);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Sigillus Premium"
      description="Mais visibilidade, mais liberdade criativa e todos os seus números na mão."
      size="md"
      mobileCentered
      actions={
        activated || isPremium ? null : (
          <ShinyButton fullWidth onClick={handleActivate}>
            Ativar Premium agora
          </ShinyButton>
        )
      }
    >
      <AnimatePresence mode="wait">
        {activated || isPremium ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="flex flex-col items-center gap-3 rounded-2xl bg-[#121212] px-6 py-10 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFDF00]/15 premium-glow-pulse">
              <Crown className="h-7 w-7 text-[#FFDF00]" aria-hidden="true" />
            </span>
            <p className="text-lg font-semibold text-[#FFDF00]">Premium ativado</p>
            <p className="text-sm text-zinc-300">
              Seu tráfego VIP, portfólio ilimitado e o topo das pesquisas já estão liberados.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="bento"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-3"
          >
            {BENTO_CELLS.map((cell, index) => {
              const Icon = cell.icon;
              const highlighted = highlight === cell.id;
              return (
                <motion.div
                  key={cell.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 340, damping: 26, delay: index * 0.06 }}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border p-4",
                    cell.span,
                    cell.dark
                      ? "border-[#DAA520]/40 bg-[#121212] text-white"
                      : "border-zinc-200 bg-white text-zinc-900",
                    highlighted && "border-[#FFDF00] premium-glow-pulse",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      cell.dark ? "bg-[#FFDF00]/15" : "bg-wine-50",
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5", cell.dark ? "text-[#FFDF00]" : "text-wine-700")}
                      aria-hidden="true"
                    />
                  </span>
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      {cell.title}
                      {highlighted ? (
                        <Sparkles className="h-3.5 w-3.5 text-[#DAA520]" aria-hidden="true" />
                      ) : null}
                    </p>
                    <p className={cn("text-xs leading-relaxed", cell.dark ? "text-zinc-300" : "text-zinc-600")}>
                      {cell.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

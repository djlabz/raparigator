"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll } from "motion/react";
import { MessageSquare, Phone, Send, X } from "lucide-react";
import type { ProfessionalAd } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MobileContactFabProps {
  ad: ProfessionalAd;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
}

export function MobileContactFab({ ad, setRiskTarget }: MobileContactFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 450) {
      if (!isVisible) setIsVisible(true);
    } else if (isVisible) {
      setIsVisible(false);
      setIsOpen(false);
    }
  });

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (showTooltip) setShowTooltip(false);
  };

  const handleDragEnd = () => {
    if (!constraintsRef.current) return;
    const rect = constraintsRef.current.getBoundingClientRect();
    const currentX = x.get();
    const currentY = y.get();

    const fabSize = 56;
    const midPoint = (rect.width - fabSize) / 2;

    if (currentX > midPoint) {
      animate(x, rect.width - fabSize, { type: "spring", bounce: 0.2, duration: 0.5 });
    } else {
      animate(x, 0, { type: "spring", bounce: 0.2, duration: 0.5 });
    }

    if (currentY > 0) {
      animate(y, 0, { type: "spring", bounce: 0.4, duration: 0.5 });
    }
  };

  return (
    <div
      className="fixed left-4 right-4 top-4 bottom-4 z-[60] pointer-events-none md:hidden"
      ref={constraintsRef}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.2}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{ x, y }}
            className="absolute bottom-[69px] flex w-14 pointer-events-auto flex-col items-center justify-end"
          >
            <div className="relative flex w-full items-center justify-center">
              <AnimatePresence>
                {showTooltip && !isOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="absolute left-17 z-10 w-max max-w-35 rounded-xl border border-dashed border-stone-400/70 bg-[#f5f4ef]/85 px-3 py-1.5 text-xs font-medium leading-tight text-zinc-700 shadow-[0_4px_16px_rgba(0,0,0,0.1)] backdrop-blur-sm"
                  >
                    <div className="absolute top-1/2 -left-1.5 h-0 w-0 -translate-y-1/2 border-y-4 border-y-transparent border-r-[6px] border-r-[#f5f4ef]/85" />
                    Clique para entrar em contato.
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 1, y: -65 }}
                      exit={{ opacity: 0, scale: 0.5, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute"
                    >
                      <Link
                        href="/chat"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#96001e] text-white shadow-lg ring-1 ring-white/20"
                      >
                        <MessageSquare className="h-4 w-4 fill-white text-white" />
                      </Link>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 1, y: -115 }}
                      exit={{ opacity: 0, scale: 0.5, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
                      className="absolute"
                    >
                      <button
                        onClick={() => setRiskTarget("WhatsApp")}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 1, y: -165 }}
                      exit={{ opacity: 0, scale: 0.5, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="absolute"
                    >
                      <button
                        onClick={() => setRiskTarget("Telegram")}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <button
                onClick={toggleOpen}
                className={cn(
                  "relative z-20 h-14 w-14 shrink-0 cursor-pointer rounded-full bg-linear-to-tr from-amber-300 via-amber-400 to-amber-200 p-0.5 shadow-xl transition-transform active:scale-95",
                  isOpen && "shadow-[0_0_20px_rgba(251,191,36,0.4)]",
                )}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border border-black/40 bg-zinc-900">
                  <Image
                    src={ad.images[0]}
                    alt={ad.artisticName}
                    fill
                    className="object-cover"
                    sizes="56px"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute right-[14.6%] bottom-[14.6%] z-20 flex h-6 w-6 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[#96001e] ring-2 ring-white">
                  {isOpen ? <X className="h-3.5 w-3.5 text-white" /> : <MessageSquare className="h-3.5 w-3.5 fill-white text-white" />}
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { ReactNode, useEffect } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

let bodyScrollLockCount = 0;
let previousBodyOverflow: string | null = null;

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  actions?: ReactNode | null;
  headerActions?: ReactNode;
  size?: "sm" | "md";
  mobileCentered?: boolean;
}

export function Modal({ open, title, description, onClose, children, actions, headerActions, size = "sm", mobileCentered = false }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    if (bodyScrollLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    bodyScrollLockCount += 1;

    return () => {
      bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);

      if (bodyScrollLockCount === 0 && previousBodyOverflow !== null) {
        document.body.style.overflow = previousBodyOverflow;
        previousBodyOverflow = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const resolvedActions = actions === undefined ? (
    <Button variant="secondary" fullWidth onClick={onClose}>
      Fechar
    </Button>
  ) : actions;

  return (
    <div className={cn(
      "fixed inset-0 z-220 flex bg-zinc-900/50 px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] touch-none sm:px-4 sm:items-center sm:justify-center",
      mobileCentered ? "items-center" : "items-end"
    )} role="dialog" aria-modal="true">
      <div
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-5",
          mobileCentered ? "max-h-[min(92dvh,48rem)]" : "max-h-[min(94dvh,48rem)]",
          size === "md" ? "sm:max-w-2xl" : "sm:max-w-md"
        )}
        style={{
          maxHeight: mobileCentered ? "calc(92dvh - max(1rem, env(safe-area-inset-top)) - max(1rem, env(safe-area-inset-bottom)))" : "calc(94dvh - max(1rem, env(safe-area-inset-top)) - max(1rem, env(safe-area-inset-bottom)))",
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-tight text-zinc-900 sm:text-lg">{title}</h3>
            {description ? <p className="text-sm leading-snug text-zinc-600">{description}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              type="button"
              aria-label="Fechar modal"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="modal-scroll min-h-0 flex-1 overflow-y-auto px-0.5 pr-1 overscroll-contain touch-pan-y sm:px-1">
          {children}
        </div>
        {resolvedActions ? <div className={cn("mt-4 flex shrink-0 gap-2 border-t border-zinc-100 pt-4", mobileCentered ? "flex-col sm:flex-row" : "flex-col sm:flex-row")}>{resolvedActions}</div> : null}
      </div>
      <button aria-label="Fechar modal" className="absolute inset-0 -z-10" onClick={onClose} />
      <style jsx>{`
        .modal-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .modal-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

        @media (min-width: 640px) {
          .modal-scroll {
            scrollbar-width: auto;
            -ms-overflow-style: auto;
          }

          .modal-scroll::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
        }
      `}</style>
    </div>
  );
}

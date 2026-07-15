"use client";

import { Button } from "./button";
import { Modal } from "./modal";

interface RiskWarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetLabel: string;
}

export function RiskWarningModal({ open, onClose, onConfirm }: RiskWarningModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🛡️ Aviso de Segurança"
      description="Você está prestes a ser redirecionado para fora da Sigillus. Lembre-se de que, ao continuar o atendimento via WhatsApp ou Telegram, não poderemos garantir o monitoramento, o suporte e a rastreabilidade oferecidos pela nossa plataforma."
      actions={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Voltar com Segurança
          </Button>
          <Button variant="primary" fullWidth onClick={onConfirm}>
            Entendi, Continuar
          </Button>
        </>
      }
    />
  );
}

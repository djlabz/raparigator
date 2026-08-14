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
      description="Você está prestes a ser redirecionado para fora da Sigillus. Conversas no WhatsApp ou no Telegram acontecem fora da plataforma, então os recursos de segurança do nosso chat — apelido, bloqueio e denúncia — não valem por lá."
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

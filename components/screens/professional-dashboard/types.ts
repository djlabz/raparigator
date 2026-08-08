export type { AnnouncementAdPreview as AdPreview } from "@/lib/announcement-draft-types";

export type HistoryItem = {
  id: number;
  client: string;
  service: string;
  date: string;
  status: "Concluído" | "Finalizado" | "Em Andamento";
  value: string;
};

export type HistoryFilter = "Todos" | "Concluído" | "Finalizado" | "Em Andamento";

export type AdStatus = "Ativo" | "Pausado";

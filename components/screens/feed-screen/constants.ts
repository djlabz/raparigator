export const quickFilters = ["Premium", "Livre Agora", "Com local"];
export const defaultLocationLabel = "São Paulo, SP";
export const defaultGender = "Todas";
export const defaultMaxPrice = 1500;
export const FEED_CARD_SIZE_CLASS = "h-[480px] w-full";

export const categoryByGender: Record<string, string> = {
  Todas: "",
  Mulher: "Feminino",
  Homem: "Masculino",
  Trans: "Trans",
  Casal: "Casais",
};

export const normalizeText = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

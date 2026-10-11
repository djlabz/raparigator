export const CLIENT_ALIAS_FIRST_WORDS = [
  "Lua",
  "Rio",
  "Vento",
  "Mar",
  "Sol",
  "Pedra",
  "Folha",
  "Nuvem",
  "Onda",
  "Serra",
  "Campo",
  "Trilha",
  "Ponte",
  "Lago",
  "Bosque",
  "Areia",
  "Farol",
  "Cometa",
  "Vale",
  "Ilha",
] as const;

export const CLIENT_ALIAS_SECOND_WORDS = [
  "Serena",
  "Azul",
  "Verde",
  "Leve",
  "Firme",
  "Gentil",
  "Breve",
  "Nobre",
  "Livre",
  "Forte",
  "Calma",
  "Clara",
  "Antiga",
  "Distante",
  "Polar",
  "Solar",
  "Lunar",
  "Imensa",
  "Silente",
  "Atenta",
] as const;

export const CLIENT_ALIAS_DIGITS = 3;

export const CLIENT_ALIAS_PATTERN = /^[A-Z][a-z]+-[A-Z][a-z]+-\d{3}$/;

export const CLIENT_ALIAS_TAKEN_MESSAGE = "Apelido já em uso.";

function pick<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length));
  return items[index]!;
}

export function generateClientAlias(random: () => number): string {
  const first = pick(CLIENT_ALIAS_FIRST_WORDS, random);
  const second = pick(CLIENT_ALIAS_SECOND_WORDS, random);
  const limit = 10 ** CLIENT_ALIAS_DIGITS;
  const number = Math.min(limit - 1, Math.floor(random() * limit));
  return `${first}-${second}-${String(number).padStart(CLIENT_ALIAS_DIGITS, "0")}`;
}

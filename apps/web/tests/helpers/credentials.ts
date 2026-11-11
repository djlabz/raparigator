export const credentials = {
  cliente: {
    email: "cliente@sigillus.dev",
    password: "Cliente@123",
    role: "cliente" as const,
  },
  profissional: {
    email: "profissional@sigillus.dev",
    password: "Profissional@123",
    role: "profissional" as const,
  },
  profissionalValentina: {
    email: "valentina-noir-campinas@sigillus.dev",
    password: "Profissional@123",
    role: "profissional" as const,
  },
  admin: {
    email: "admin@sigillus.dev",
    password: "Admin@123",
  },
};

export const ads = {
  premiumSlug: "luna-velvet-sao-paulo",
  premiumName: "Luna Velvet",
  standardSlug: "valentina-noir-campinas",
  standardName: "Valentina Noir",
};

export const adTiers = [
  { tier: "premium", slug: ads.premiumSlug, name: ads.premiumName },
  { tier: "standard", slug: ads.standardSlug, name: ads.standardName },
] as const;

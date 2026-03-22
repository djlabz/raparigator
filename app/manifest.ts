import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sigillus",
    short_name: "Sigillus",
    description: "Plataforma premium para intermediar clientes e profissionais com seguranca.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b60031",
    lang: "pt-BR",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}


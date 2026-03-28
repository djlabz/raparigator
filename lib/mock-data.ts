import type { Conversation, MediaHighlight, Message, ProfessionalAd, Review } from "./types";

export const states = ["SP", "RJ", "MG", "PR", "SC", "RS"];
export const cities = ["Sao Paulo", "Campinas", "Santos", "Rio de Janeiro", "Belo Horizonte", "Curitiba"];
export const categories = ["Feminina", "Masculino", "Trans", "Casais"];

export const locationsData = [
  { city: "São Paulo", state: "SP" },
  { city: "Rio de Janeiro", state: "RJ" },
  { city: "Belo Horizonte", state: "MG" },
  { city: "Aracaju", state: "SE" },
  { city: "Curitiba", state: "PR" },
  { city: "Salvador", state: "BA" },
  { city: "Florianópolis", state: "SC" },
  { city: "Porto Alegre", state: "RS" },
  { city: "Brasília", state: "DF" },
  // Adicione outras cidades conforme necessário
];

export const ads: ProfessionalAd[] = [
  {
    id: "1",
    slug: "luna-velvet-sao-paulo",
    displayName: "Luna",
    artisticName: "Luna Velvet",
    city: "Sao Paulo",
    state: "SP",
    neighborhood: "Itaim Bibi",
    category: "Feminino",
    shortDescription: "Atendimento discreto com experiencia premium e ambiente reservado.",
    description: "Perfil verificado, atendimento com foco em elegancia, pontualidade e seguranca.",
    startingPrice: 450,
    heightCm: 170,
    ethnicity: "Branca",
    hairColor: "Castanho",
    services: ["Jantar", "Companhia", "Evento social", "Atendimento em hotel"],
    pricingTable: [
      { label: "1 hora", price: 450 },
      { label: "2 horas", price: 800 },
      { label: "Pernoite", price: 1900 },
    ],
    status: "livre",
    adTier: "premium",
    images: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
    ],
    rating: 4.9,
    reviewsCount: 128,
    profileViews: 21450,
  },
  {
    id: "2",
    slug: "valentina-noir-campinas",
    displayName: "Valentina",
    artisticName: "Valentina Noir",
    city: "Campinas",
    state: "SP",
    neighborhood: "Cambui",
    category: "Feminino",
    shortDescription: "Conversas inteligentes e experiencia acolhedora com alto nivel de discricao.",
    description: "Atendimento personalizado, local elegante e total respeito a privacidade.",
    startingPrice: 380,
    heightCm: 165,
    ethnicity: "Parda",
    hairColor: "Preto",
    services: ["Companhia", "Jantar", "Viagens curtas"],
    pricingTable: [
      { label: "1 hora", price: 380 },
      { label: "2 horas", price: 690 },
      { label: "4 horas", price: 1250 },
    ],
    status: "em_atendimento",
    adTier: "normal",
    images: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
    ],
    rating: 4.8,
    reviewsCount: 92,
    profileViews: 18670,
  },
  {
    id: "3",
    slug: "alex-rivera-rio",
    displayName: "Alex",
    artisticName: "Alex Rivera",
    city: "Rio de Janeiro",
    state: "RJ",
    neighborhood: "Ipanema",
    category: "Masculino",
    shortDescription: "Perfil verificado para eventos e companhia com postura profissional.",
    description: "Atendimento discreto com foco em conforto, conversa e presenca marcante.",
    startingPrice: 420,
    heightCm: 182,
    ethnicity: "Latino",
    hairColor: "Castanho",
    services: ["Eventos", "Companhia", "Acompanhamento corporativo"],
    pricingTable: [
      { label: "1 hora", price: 420 },
      { label: "2 horas", price: 760 },
      { label: "Pernoite", price: 1800 },
    ],
    status: "indisponivel",
    adTier: "premium",
    images: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=80",
    ],
    rating: 4.7,
    reviewsCount: 57,
    profileViews: 17420,
  },
  {
    id: "4",
    slug: "maya-aurora-curitiba",
    displayName: "Maya",
    artisticName: "Maya Aurora",
    city: "Curitiba",
    state: "PR",
    neighborhood: "Batel",
    category: "Trans",
    shortDescription: "Atendimento premium com discricao e suporte completo na plataforma.",
    description: "Perfil com verificacao ativa e atendimento de alto padrao em ambiente seguro.",
    startingPrice: 520,
    heightCm: 175,
    ethnicity: "Branca",
    hairColor: "Loiro",
    services: ["Companhia", "Eventos", "Atendimento em hotel"],
    pricingTable: [
      { label: "1 hora", price: 520 },
      { label: "2 horas", price: 940 },
      { label: "Pernoite", price: 2100 },
    ],
    status: "livre",
    adTier: "premium",
    images: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
    ],
    rating: 4.95,
    reviewsCount: 147,
    profileViews: 23990,
  },
];

export const reviews: Review[] = [
  { id: "r1", adId: "1", author: "Cliente verificado", score: 5, comment: "Pontual, educada e super discreta.", createdAt: "2026-02-27" },
  { id: "r2", adId: "1", author: "Cliente premium", score: 5, comment: "Experiencia impecavel do inicio ao fim.", createdAt: "2026-02-21" },
  { id: "r3", adId: "2", author: "Cliente verificado", score: 4, comment: "Excelente conversa e atendimento cordial.", createdAt: "2026-02-25" },
  { id: "r4", adId: "4", author: "Cliente premium", score: 5, comment: "Super profissional e comunicativa.", createdAt: "2026-03-01" },
];

export const mediaHighlights: MediaHighlight[] = [
  { id: "ph1", kind: "foto", category: "Feminino", professionalName: "Luna Velvet", coverUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80", likes: 1820, views: 40210 },
  { id: "ph2", kind: "foto", category: "Masculino", professionalName: "Alex Rivera", coverUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80", likes: 1210, views: 33100 },
  { id: "ph3", kind: "foto", category: "Trans", professionalName: "Maya Aurora", coverUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80", likes: 1960, views: 44150 },
  { id: "vd1", kind: "video", category: "Feminino", professionalName: "Valentina Noir", coverUrl: "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=900&q=80", likes: 1420, views: 51240 },
  { id: "vd2", kind: "video", category: "Masculino", professionalName: "Alex Rivera", coverUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=80", likes: 980, views: 28600 },
  { id: "vd3", kind: "video", category: "Trans", professionalName: "Maya Aurora", coverUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80", likes: 1670, views: 45870 },
];

export const conversations: Conversation[] = [
  { id: "c1", contactName: "Luna Velvet", contactStatus: "Online", lastMessage: "Posso te receber as 21h.", lastMessageAt: "16:20", unread: 1 },
  { id: "c2", contactName: "Valentina Noir", contactStatus: "Visto ha 5 min", lastMessage: "Confirmei seu agendamento.", lastMessageAt: "15:02", unread: 0 },
  { id: "c3", contactName: "Suporte Sigillus", contactStatus: "Online", lastMessage: "Seu pagamento esta em custodia.", lastMessageAt: "13:11", unread: 0 },
];

export const messages: Message[] = [
  { id: "m1", conversationId: "c1", from: "other", content: "Oi, vi seu pedido para hoje.", sentAt: "16:00" },
  { id: "m2", conversationId: "c1", from: "me", content: "Perfeito, consegue as 21h?", sentAt: "16:05" },
  { id: "m3", conversationId: "c1", from: "other", content: "Consigo sim. Local discreto e seguro.", sentAt: "16:08" },
  { id: "m4", conversationId: "c1", from: "me", content: "Fechado. Vou finalizar no app.", sentAt: "16:11" },
  { id: "m5", conversationId: "c1", from: "other", content: "Posso te receber as 21h.", sentAt: "16:20" },
];

export const serviceTracking = {
  status: "Em deslocamento",
  estimatedArrival: "18 min",
  checkInCode: "SIG-9412",
  elapsed: "00:42:18",
};

export const dashboardSummary = {
  monthRevenue: 28450,
  completedServices: 46,
  activeAd: true,
  profileViews: 1290,
  conversionRate: 18.2,
};

export const popularSections = [
  { label: "Independencia Financeira", href: "/popular/independencia-financeira", description: "Simule renda e tempo para chegar no primeiro milhao." },
  { label: "Mais avaliadas", href: "/popular/mais-avaliadas", description: "Veja as profissionais com maior media por categoria." },
  { label: "Mais vistas", href: "/popular/mais-vistas", description: "Confira os perfis com mais visualizacoes do momento." },
  { label: "Fotos bombando", href: "/popular/fotos-bombando", description: "Ranking de fotos com mais curtidas e views." },
  { label: "Videos bombando", href: "/popular/videos-bombando", description: "Ranking de videos mais populares da plataforma." },
];

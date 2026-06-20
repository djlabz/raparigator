import type { Metadata } from "next";
import { AdDetailsScreen } from "@/components/screens/ad-details";
import { ads } from "@/lib/mock-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ad = ads.find((item) => item.slug === slug);
  if (!ad) return { title: "Anuncio nao encontrado | Sigillus", description: "O perfil solicitado nao foi encontrado." };
  return { title: `${ad.artisticName} em ${ad.city} | Sigillus`, description: `${ad.shortDescription} A partir de R$ ${ad.startingPrice}.` };
}

export default async function AdDetailsPage({ params }: Props) {
  const { slug } = await params;
  return <AdDetailsScreen slug={slug} />;
}

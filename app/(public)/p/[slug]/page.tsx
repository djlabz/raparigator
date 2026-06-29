import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function ShortProfileRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/anuncio/${slug}`);
}

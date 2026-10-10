export default async function globalSetup() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";
  const maxAttempts = 30;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${apiUrl}/healthz`);
      if (res.ok) {
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`API não respondeu em ${apiUrl}/healthz após 30 segundos`);
}

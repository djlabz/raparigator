import path from "node:path";
import type { NextConfig } from "next";

type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port: string;
  pathname: string;
};

type RemotePatternsEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_MEDIA_URL?: string;
};

const devRemotePatterns: RemotePattern[] = [
  { protocol: "http", hostname: "localhost", port: "9000", pathname: "/**" },
  { protocol: "http", hostname: "localhost", port: "9010", pathname: "/**" },
  { protocol: "http", hostname: "127.0.0.1", port: "9000", pathname: "/**" },
  { protocol: "http", hostname: "127.0.0.1", port: "9010", pathname: "/**" },
  { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
];

function mediaRemotePattern(mediaUrl: string): RemotePattern {
  const url = new URL(mediaUrl);
  const protocol = url.protocol.replace(/:$/, "");
  if (protocol !== "http" && protocol !== "https") {
    throw new Error(`NEXT_PUBLIC_MEDIA_URL precisa usar http ou https: '${mediaUrl}'`);
  }
  const basePath = url.pathname.replace(/\/+$/, "");
  return {
    protocol,
    hostname: url.hostname,
    port: url.port,
    pathname: `${basePath}/**`,
  };
}

export function buildRemotePatterns(env: RemotePatternsEnv): RemotePattern[] {
  const mediaUrl = env.NEXT_PUBLIC_MEDIA_URL?.trim();
  const patterns = mediaUrl ? [mediaRemotePattern(mediaUrl)] : [];
  if (env.NODE_ENV === "production") {
    return patterns;
  }
  return [...patterns, ...devRemotePatterns];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    qualities: [90, 75],
    remotePatterns: buildRemotePatterns(process.env),
  },
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["motion", "@sigillus/contracts", "@sigillus/domain"],
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;

import { describe, expect, it } from "vitest";
import { buildRemotePatterns, servesMediaFromLoopback } from "../next.config";

const devHosts = ["localhost", "127.0.0.1"];

describe("buildRemotePatterns", () => {
  it("em produção aceita só o host de NEXT_PUBLIC_MEDIA_URL", () => {
    const patterns = buildRemotePatterns({
      NODE_ENV: "production",
      NEXT_PUBLIC_MEDIA_URL: "https://media.example.com/sigillus-media",
    });

    expect(patterns).toContainEqual({
      protocol: "https",
      hostname: "media.example.com",
      port: "",
      pathname: "/sigillus-media/**",
    });
    const hostnames = patterns.map((pattern) => pattern.hostname);
    for (const host of devHosts) {
      expect(hostnames).not.toContain(host);
    }
  });

  it("fora de produção libera só o MinIO local, sem host externo", () => {
    const patterns = buildRemotePatterns({ NODE_ENV: "development" });
    const hostnames = patterns.map((pattern) => pattern.hostname);

    for (const host of devHosts) {
      expect(hostnames).toContain(host);
    }
    expect(hostnames).not.toContain("images.pexels.com");
    expect(hostnames).not.toContain("images.unsplash.com");
    expect(patterns.every((pattern) => pattern.protocol === "http")).toBe(true);
    expect(patterns).toContainEqual({
      protocol: "http",
      hostname: "localhost",
      port: "9000",
      pathname: "/**",
    });
  });

  it("fora de produção também aceita o host de mídia quando definido", () => {
    const patterns = buildRemotePatterns({
      NODE_ENV: "development",
      NEXT_PUBLIC_MEDIA_URL: "http://media.localhost:9100",
    });

    expect(patterns).toContainEqual({
      protocol: "http",
      hostname: "media.localhost",
      port: "9100",
      pathname: "/**",
    });
  });

  it("em produção sem NEXT_PUBLIC_MEDIA_URL não libera nenhum host", () => {
    expect(buildRemotePatterns({ NODE_ENV: "production" })).toEqual([]);
  });
});

describe("servesMediaFromLoopback", () => {
  it("sem URL de mídia, só fora de produção a mídia é o MinIO local", () => {
    expect(servesMediaFromLoopback({ NODE_ENV: "development" })).toBe(true);
    expect(servesMediaFromLoopback({ NODE_ENV: "production" })).toBe(false);
  });

  it("com URL de mídia, vale o host configurado", () => {
    expect(
      servesMediaFromLoopback({
        NODE_ENV: "production",
        NEXT_PUBLIC_MEDIA_URL: "http://localhost:9000/sigillus-media",
      }),
    ).toBe(true);
    expect(
      servesMediaFromLoopback({
        NODE_ENV: "production",
        NEXT_PUBLIC_MEDIA_URL: "https://media.example.com/sigillus-media",
      }),
    ).toBe(false);
    expect(
      servesMediaFromLoopback({
        NODE_ENV: "development",
        NEXT_PUBLIC_MEDIA_URL: "https://media.example.com/sigillus-media",
      }),
    ).toBe(false);
  });
});

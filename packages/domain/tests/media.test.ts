import { describe, expect, it } from "vitest";
import { isPublicMediaPurpose, isVideoSource, mediaExtensionFor } from "../src/media";

describe("media", () => {
  it("extensão vem do catálogo ou do subtipo saneado", () => {
    expect(mediaExtensionFor("image/jpeg")).toBe("jpg");
    expect(mediaExtensionFor("video/x-matroska")).toBe("mkv");
    expect(mediaExtensionFor("image/svg+xml")).toBe("svgxml");
    expect(mediaExtensionFor("application")).toBe("bin");
  });

  it("galeria e foto de perfil são públicas; chat, identidade e denúncia não", () => {
    expect(isPublicMediaPurpose("gallery")).toBe(true);
    expect(isPublicMediaPurpose("profile")).toBe(true);
    expect(isPublicMediaPurpose("chat")).toBe(false);
  });

  it("reconhece vídeo por data URL ou pelas extensões aceitas pela API", () => {
    expect(isVideoSource("data:video/mp4;base64,AAA")).toBe(true);
    expect(isVideoSource("https://cdn/x/clip.MOV?sig=1")).toBe(true);
    expect(isVideoSource("https://cdn/x/clip.mkv")).toBe(true);
    expect(isVideoSource("https://cdn/x/foto.webp")).toBe(false);
    expect(isVideoSource("")).toBe(false);
  });
});

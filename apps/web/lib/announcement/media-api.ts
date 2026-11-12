import type { MediaAsset, MediaPurpose } from "@sigillus/contracts";
import { getApiClient } from "@/lib/api/client";
import { reportStoreError } from "@/lib/report-store-error";

export function isPlanLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  return (error as { code?: string }).code === "PLAN_LIMIT";
}

async function pollMediaUntilReady(
  assetId: string,
  maxAttempts = 30,
  pollIntervalMs = 400,
): Promise<MediaAsset> {
  const client = getApiClient();
  for (let i = 0; i < maxAttempts; i++) {
    const asset = await client.media.get({ assetId });
    if (asset.status === "ready") {
      return asset;
    }
    if (asset.status === "blocked") {
      throw new Error("Esta imagem não pode ser publicada.");
    }
    if (asset.status === "failed" || asset.status === "rejected") {
      throw new Error(asset.moderationReason ?? "Falha no processamento da mídia.");
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return client.media.get({ assetId });
}

export async function uploadMediaFile(
  file: File,
  purpose: MediaPurpose = "gallery",
  onProgress?: (phase: "uploading" | "processing" | "ready") => void,
): Promise<MediaAsset> {
  const client = getApiClient();
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const contentType = file.type || (kind === "video" ? "video/mp4" : "image/jpeg");

  onProgress?.("uploading");
  const createRes = await client.media.createUpload({
    kind,
    purpose,
    contentType,
    sizeBytes: file.size,
    fileName: file.name,
  });

  const uploadRes = await fetch(createRes.uploadUrl, {
    method: "PUT",
    headers: createRes.headers,
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Falha no upload do arquivo (${uploadRes.status})`);
  }

  onProgress?.("processing");
  await client.media.completeUpload({ assetId: createRes.asset.id });

  const readyAsset = await pollMediaUntilReady(createRes.asset.id);
  onProgress?.("ready");
  return readyAsset;
}

export async function removeMedia(assetId: string): Promise<boolean> {
  try {
    await getApiClient().media.remove({ assetId });
    return true;
  } catch (error) {
    reportStoreError("media.remove", error);
    return false;
  }
}

export async function reorderMedia(assetIds: string[]): Promise<boolean> {
  try {
    await getApiClient().media.reorder({ assetIds });
    return true;
  } catch (error) {
    reportStoreError("media.reorder", error);
    return false;
  }
}

export async function setProfileImageMedia(assetId: string | null): Promise<boolean> {
  try {
    await getApiClient().media.setProfileImage({ assetId });
    return true;
  } catch (error) {
    reportStoreError("media.setProfileImage", error);
    return false;
  }
}

export async function listMyMedia(purpose?: MediaPurpose): Promise<MediaAsset[]> {
  const client = getApiClient();
  return client.media.listMine({ purpose });
}

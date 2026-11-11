import sharp, { type Sharp } from "sharp";
import { DHASH_HEIGHT, DHASH_WIDTH, dHash64 } from "@sigillus/domain";

export type StrippedImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

function encodeAs(image: Sharp, contentType: string): Sharp {
  switch (contentType) {
    case "image/jpeg":
      return image.jpeg({ quality: 90, mozjpeg: true });
    case "image/png":
      return image.png();
    case "image/webp":
      return image.webp({ quality: 90 });
    case "image/avif":
      return image.avif();
    case "image/gif":
      return image.gif();
    default:
      throw new Error(`formato de imagem sem limpeza de metadados: ${contentType}`);
  }
}

export async function stripImageMetadata(
  bytes: Uint8Array,
  contentType: string,
): Promise<StrippedImage> {
  const image = encodeAs(sharp(Buffer.from(bytes), { failOn: "none" }).rotate(), contentType);
  const { data, info } = await image.toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

export async function computeImageHash(bytes: Uint8Array): Promise<string> {
  const { data, info } = await sharp(Buffer.from(bytes), { failOn: "none" })
    .rotate()
    .removeAlpha()
    .grayscale()
    .resize(DHASH_WIDTH, DHASH_HEIGHT, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const gray = new Uint8Array(DHASH_WIDTH * DHASH_HEIGHT);
  for (let index = 0; index < gray.length; index += 1) {
    gray[index] = data[index * info.channels]!;
  }
  return dHash64(gray);
}

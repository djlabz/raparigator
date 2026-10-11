import sharp from "sharp";
import { DHASH_HEIGHT, DHASH_WIDTH, dHash64 } from "@sigillus/domain";

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

/**
 * @file BMP conversion — transforms DIB clipboard data into BMP file format.
 */
import { BI_BITFIELDS, SIZEOF_BITMAPFILEHEADER } from "../win32/constants.ts";
import { buildBitmapFileHeader } from "../win32/structs.ts";

/** Calculate the color table size from BITMAPINFOHEADER fields. */
function getColorTableSize(dib: Buffer): number {
  const biBitCount = dib.readUInt16LE(14);
  const biCompression = dib.readUInt32LE(16);
  const biClrUsed = dib.readUInt32LE(32);

  if (biCompression === BI_BITFIELDS) {
    if (biBitCount === 16 || biBitCount === 32) return 12;
  }

  if (biBitCount <= 8) {
    const numColors = biClrUsed > 0 ? biClrUsed : 1 << biBitCount;
    return numColors * 4;
  }

  return 0;
}

/** Convert DIB data to a complete BMP file buffer. */
export function dibToBmp(dibData: Buffer): Buffer {
  const biSize = dibData.readUInt32LE(0);
  const colorTableSize = getColorTableSize(dibData);
  const offBits = SIZEOF_BITMAPFILEHEADER + biSize + colorTableSize;
  const fileSize = SIZEOF_BITMAPFILEHEADER + dibData.length;

  const fileHeader = buildBitmapFileHeader(fileSize, offBits);
  return Buffer.concat([fileHeader, dibData]);
}

import { describe, expect, it } from "bun:test";
import { SIZEOF_BITMAPFILEHEADER } from "../win32/constants.ts";
import { dibToBmp } from "./bmp.ts";

function makeDib(bitCount: number, compression: number, colorTableBytes: number, pixelBytes: number): Buffer {
  const headerSize = 40;
  const dib = Buffer.alloc(headerSize + colorTableBytes + pixelBytes);
  dib.writeUInt32LE(headerSize, 0);
  dib.writeInt32LE(1, 4);
  dib.writeInt32LE(1, 8);
  dib.writeUInt16LE(1, 12);
  dib.writeUInt16LE(bitCount, 14);
  dib.writeUInt32LE(compression, 16);
  dib.writeUInt32LE(pixelBytes, 20);
  dib.writeUInt32LE(0, 32);
  return dib;
}

describe("dibToBmp", () => {
  describe("success", () => {
    it("produces a valid BMP signature", () => {
      const bmp = dibToBmp(makeDib(32, 0, 0, 4));
      expect(bmp.readUInt16LE(0)).toBe(0x4d42);
    });

    it("sets correct file size for 32-bit BI_RGB", () => {
      const dib = makeDib(32, 0, 0, 4);
      const bmp = dibToBmp(dib);
      expect(bmp.readUInt32LE(2)).toBe(SIZEOF_BITMAPFILEHEADER + dib.length);
      expect(bmp.length).toBe(SIZEOF_BITMAPFILEHEADER + dib.length);
    });

    it("sets correct offBits for 32-bit BI_RGB (no color table)", () => {
      const bmp = dibToBmp(makeDib(32, 0, 0, 4));
      expect(bmp.readUInt32LE(10)).toBe(SIZEOF_BITMAPFILEHEADER + 40);
    });

    it("sets correct offBits for 24-bit BI_RGB", () => {
      const bmp = dibToBmp(makeDib(24, 0, 0, 4));
      expect(bmp.readUInt32LE(10)).toBe(SIZEOF_BITMAPFILEHEADER + 40);
    });

    it("accounts for 12-byte color masks in 16-bit BI_BITFIELDS", () => {
      const bmp = dibToBmp(makeDib(16, 3, 12, 2));
      expect(bmp.readUInt32LE(10)).toBe(SIZEOF_BITMAPFILEHEADER + 40 + 12);
    });

    it("accounts for color table in 8-bit indexed color", () => {
      const colorTableBytes = 256 * 4;
      const bmp = dibToBmp(makeDib(8, 0, colorTableBytes, 4));
      expect(bmp.readUInt32LE(10)).toBe(SIZEOF_BITMAPFILEHEADER + 40 + colorTableBytes);
    });

    it("preserves DIB pixel data after BMP header", () => {
      const dib = makeDib(32, 0, 0, 4);
      dib.writeUInt8(0xaa, 40);
      dib.writeUInt8(0xbb, 41);
      const bmp = dibToBmp(dib);
      expect(bmp.readUInt8(SIZEOF_BITMAPFILEHEADER + 40)).toBe(0xaa);
      expect(bmp.readUInt8(SIZEOF_BITMAPFILEHEADER + 41)).toBe(0xbb);
    });
  });

  describe("errors", () => {
    it("throws on buffer too small to contain header", () => {
      expect(() => dibToBmp(Buffer.alloc(10))).toThrow();
    });

    it("throws on empty buffer", () => {
      expect(() => dibToBmp(Buffer.alloc(0))).toThrow();
    });

    it("handles header-only DIB without pixel data", () => {
      const bmp = dibToBmp(makeDib(32, 0, 0, 0));
      expect(bmp.readUInt16LE(0)).toBe(0x4d42);
      expect(bmp.length).toBe(SIZEOF_BITMAPFILEHEADER + 40);
    });
  });
});

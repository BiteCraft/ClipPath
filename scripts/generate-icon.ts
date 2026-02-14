/**
 * Generates a custom .ico file for the ClipPath tray app.
 * Design: Dark circle with a bold white circuit-trace Z-shaped path.
 * Represents "file path" in an abstract, modern way.
 * Produces 16x16, 32x32, and 48x48 sizes.
 */

// BGRA colors (Blue, Green, Red, Alpha)
const _T = [0, 0, 0, 0] as const;                 // Transparent
const BG = [0x2a, 0x2a, 0x2a, 0xff] as const;     // Dark fill #2A2A2A
const BD = [0x3e, 0x3e, 0x3e, 0xff] as const;     // Border ring #3E3E3E
const W  = [0xff, 0xff, 0xff, 0xff] as const;     // White (path)
const G  = [0x88, 0x88, 0x88, 0xff] as const;     // Gray (start node)

type Color = readonly [number, number, number, number];

class Canvas {
  data: Uint8Array;
  constructor(
    public w: number,
    public h: number,
  ) {
    this.data = new Uint8Array(w * h * 4);
  }

  set(x: number, y: number, c: Color) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0]!;
    this.data[i + 1] = c[1]!;
    this.data[i + 2] = c[2]!;
    this.data[i + 3] = c[3]!;
  }

  rect(x1: number, y1: number, x2: number, y2: number, c: Color) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) this.set(x, y, c);
  }

  circle(cx: number, cy: number, r: number, c: Color) {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r) this.set(cx + x, cy + y, c);
  }

  getBGRABottomUp(): Buffer {
    const buf = Buffer.alloc(this.w * this.h * 4);
    for (let y = 0; y < this.h; y++) {
      const dstRow = this.h - 1 - y;
      for (let x = 0; x < this.w; x++) {
        const si = (y * this.w + x) * 4;
        const di = (dstRow * this.w + x) * 4;
        buf[di] = this.data[si]!;
        buf[di + 1] = this.data[si + 1]!;
        buf[di + 2] = this.data[si + 2]!;
        buf[di + 3] = this.data[si + 3]!;
      }
    }
    return buf;
  }

  getANDMask(): Buffer {
    const rowBytes = Math.ceil(this.w / 8);
    const paddedRowBytes = Math.ceil(rowBytes / 4) * 4;
    const buf = Buffer.alloc(paddedRowBytes * this.h);
    for (let y = 0; y < this.h; y++) {
      const dstRow = this.h - 1 - y;
      for (let x = 0; x < this.w; x++) {
        const alpha = this.data[(y * this.w + x) * 4 + 3]!;
        if (alpha < 128) {
          const byteIdx = dstRow * paddedRowBytes + Math.floor(x / 8);
          const bitIdx = 7 - (x % 8);
          buf[byteIdx] = buf[byteIdx]! | (1 << bitIdx);
        }
      }
    }
    return buf;
  }
}

// ===== 48x48 =====
function draw48(): Canvas {
  const c = new Canvas(48, 48);

  // Dark circle with subtle border
  c.circle(23, 23, 22, BD);
  c.circle(23, 23, 21, BG);

  // Z-shaped path trace (white, 4px thick)
  c.rect(10, 14, 25, 17, W);   // Top horizontal
  c.rect(22, 14, 25, 33, W);   // Vertical connector
  c.rect(22, 30, 37, 33, W);   // Bottom horizontal

  // Endpoint nodes
  c.circle(9, 15, 3, G);       // Start node (gray)
  c.circle(38, 31, 3, W);      // End node (white)

  return c;
}

// ===== 32x32 =====
function draw32(): Canvas {
  const c = new Canvas(32, 32);

  // Dark circle with subtle border
  c.circle(15, 15, 14, BD);
  c.circle(15, 15, 13, BG);

  // Z-shaped path trace (white, 3px thick)
  c.rect(6, 9, 16, 11, W);     // Top horizontal
  c.rect(14, 9, 16, 21, W);    // Vertical connector
  c.rect(14, 19, 24, 21, W);   // Bottom horizontal

  // Endpoint nodes
  c.circle(5, 10, 2, G);       // Start node
  c.circle(25, 20, 2, W);      // End node

  return c;
}

// ===== 16x16 =====
function draw16(): Canvas {
  const c = new Canvas(16, 16);

  // Dark circle (no border ring at this size)
  c.circle(7, 7, 7, BG);

  // Z-shaped path trace (white, 2px thick)
  c.rect(2, 4, 8, 5, W);       // Top horizontal
  c.rect(7, 4, 8, 10, W);      // Vertical connector
  c.rect(7, 9, 13, 10, W);     // Bottom horizontal

  // Endpoint dots
  c.rect(1, 4, 2, 5, G);       // Start (gray)
  c.rect(13, 9, 14, 10, W);    // End (white, brighter)

  return c;
}

function buildICO(canvases: Canvas[]): Buffer {
  const count = canvases.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries: Buffer[] = [];
  const images: Buffer[] = [];
  let offset = 6 + count * 16;

  for (const canvas of canvases) {
    const pixels = canvas.getBGRABottomUp();
    const andMask = canvas.getANDMask();

    const bih = Buffer.alloc(40);
    bih.writeUInt32LE(40, 0);
    bih.writeInt32LE(canvas.w, 4);
    bih.writeInt32LE(canvas.h * 2, 8);
    bih.writeUInt16LE(1, 12);
    bih.writeUInt16LE(32, 14);
    bih.writeUInt32LE(0, 16);
    bih.writeUInt32LE(pixels.length + andMask.length, 20);

    const imageData = Buffer.concat([bih, pixels, andMask]);

    const entry = Buffer.alloc(16);
    entry.writeUInt8(canvas.w >= 256 ? 0 : canvas.w, 0);
    entry.writeUInt8(canvas.h >= 256 ? 0 : canvas.h, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(imageData.length, 8);
    entry.writeUInt32LE(offset, 12);

    entries.push(entry);
    images.push(imageData);
    offset += imageData.length;
  }

  return Buffer.concat([header, ...entries, ...images]);
}

const icon16 = draw16();
const icon32 = draw32();
const icon48 = draw48();
const ico = buildICO([icon16, icon32, icon48]);

const outPath = new URL("../assets/icon.ico", import.meta.url).pathname.slice(1);
await Bun.write(outPath, ico);
console.log(`Icon generated: ${outPath} (${ico.length} bytes)`);

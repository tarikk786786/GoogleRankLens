const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4;
  const scanlineLength = 1 + width * bytesPerPixel;
  const rawBuffer = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawBuffer[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawBuffer[pixelOffset] = r;
      rawBuffer[pixelOffset + 1] = g;
      rawBuffer[pixelOffset + 2] = b;
      rawBuffer[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawBuffer);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// GoogleRankLens Logo Icon (Electric Blue to Emerald Gradient with Search Rank symbol)
function drawIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const r = w / 2 - 1;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Outer rounded square / shield
  const cornerR = w * 0.22;
  const ax = Math.abs(x - cx);
  const ay = Math.abs(y - cy);
  const halfBox = w * 0.44;

  let inside = false;
  if (ax <= halfBox - cornerR && ay <= halfBox) inside = true;
  else if (ay <= halfBox - cornerR && ax <= halfBox) inside = true;
  else {
    const cdx = ax - (halfBox - cornerR);
    const cdy = ay - (halfBox - cornerR);
    if (cdx * cdx + cdy * cdy <= cornerR * cornerR) inside = true;
  }

  if (!inside) return [0, 0, 0, 0]; // Transparent background

  // Background Gradient (Dark Blue #0f172a to Slate #1e293b)
  const grad = y / h;
  let bgR = Math.round(15 + grad * 15);
  let bgG = Math.round(23 + grad * 18);
  let bgB = Math.round(42 + grad * 25);

  // Center Magnifier Glass & Rank Bar (#)
  const magR = w * 0.24;
  const magCX = cx - w * 0.04;
  const magCY = cy - h * 0.04;
  const mDist = Math.sqrt((x - magCX) * (x - magCX) + (y - magCY) * (y - magCY));

  // Magnifier ring
  const ringWidth = Math.max(1.5, w * 0.08);
  if (Math.abs(mDist - magR) < ringWidth / 2) {
    // Electric Google Blue #3b82f6
    return [59, 130, 246, 255];
  }

  // Magnifier handle
  const handleLen = w * 0.22;
  const hx = x - (magCX + magR * 0.7);
  const hy = y - (magCY + magR * 0.7);
  if (hx > 0 && hy > 0 && Math.abs(hx - hy) < ringWidth / 1.8 && hx < handleLen && hy < handleLen) {
    // Emerald green handle accent #10b981
    return [16, 185, 129, 255];
  }

  // Inside magnifier: mini rank symbol or dot
  if (mDist < magR - ringWidth / 2) {
    // Subtle glow inside lens
    bgR = Math.round(30 + grad * 30);
    bgG = Math.round(58 + grad * 40);
    bgB = Math.round(138 + grad * 60);

    // Rank #1 vertical bar in center of lens
    if (Math.abs(x - magCX) < Math.max(1, w * 0.04) && Math.abs(y - magCY) < magR * 0.55) {
      return [248, 250, 252, 255]; // Crisp white rank #1
    }
  }

  // Subtle border
  if (inside && (ax > halfBox - 1.2 || ay > halfBox - 1.2)) {
    return [71, 85, 105, 200];
  }

  return [bgR, bgG, bgB, 255];
}

const outDir = path.join(__dirname, 'icons');
[16, 48, 128].forEach(size => {
  const png = createPNG(size, size, drawIcon);
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
});

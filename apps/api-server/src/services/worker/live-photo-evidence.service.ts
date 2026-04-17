import ExifParser from "exif-parser";
import { Jimp } from "jimp";

export type LatLng = {
  lat: number;
  lng: number;
};

export type LivePhotoInput = {
  imageDataUrl: string;
  captureMode?: string;
  clientCapturedAt?: number;
};

export type LivePhotoAnalysis = {
  mimeType: string;
  byteSize: number;
  pHashBits: string;
  embedding: number[];
  exifTimestampMs?: number;
  gps?: LatLng;
  capturedAtMs: number;
  captureMode: string;
};

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function decodeImageDataUrl(dataUrl: string): { mimeType: string; imageBuffer: Buffer } {
  const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,([\s\S]+)$/.exec((dataUrl || "").trim());
  if (!match) {
    throw new Error("Invalid image payload. Capture a live photo and try again.");
  }

  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error("Unsupported image format. Use JPEG, PNG, or WEBP.");
  }

  try {
    const imageBuffer = Buffer.from(match[2], "base64");
    return { mimeType, imageBuffer };
  } catch {
    throw new Error("Corrupted image payload.");
  }
}

function extractExifMetadata(imageBuffer: Buffer): { exifTimestampMs?: number; gps?: LatLng } {
  try {
    const parser = ExifParser.create(imageBuffer);
    const parsed = parser.parse();
    const tags = parsed.tags || {};

    const timestampSeconds =
      typeof tags.DateTimeOriginal === "number"
        ? tags.DateTimeOriginal
        : typeof tags.CreateDate === "number"
          ? tags.CreateDate
          : typeof tags.ModifyDate === "number"
            ? tags.ModifyDate
            : undefined;

    const exifTimestampMs = typeof timestampSeconds === "number" ? timestampSeconds * 1000 : undefined;

    const lat = typeof tags.GPSLatitude === "number" ? tags.GPSLatitude : undefined;
    const lng = typeof tags.GPSLongitude === "number" ? tags.GPSLongitude : undefined;

    const gps = typeof lat === "number" && typeof lng === "number" ? { lat, lng } : undefined;

    return {
      exifTimestampMs,
      gps,
    };
  } catch {
    return {};
  }
}

function rgbaFromPixelInt(pixel: number): { r: number; g: number; b: number; a: number } {
  return {
    r: (pixel >>> 24) & 0xff,
    g: (pixel >>> 16) & 0xff,
    b: (pixel >>> 8) & 0xff,
    a: pixel & 0xff,
  };
}

function buildAverageHashBits(image: any): string {
  const resized = image.clone().resize({ w: 8, h: 8 }).greyscale();
  const values: number[] = [];

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const rgba = rgbaFromPixelInt(resized.getPixelColor(x, y));
      values.push(rgba.r);
    }
  }

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.map((value) => (value >= avg ? "1" : "0")).join("");
}

function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (!norm) return vec;
  return vec.map((v) => v / norm);
}

function buildEmbedding(image: any): number[] {
  const resized = image.clone().resize({ w: 16, h: 16 }).greyscale();
  const vec: number[] = [];

  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const rgba = rgbaFromPixelInt(resized.getPixelColor(x, y));
      vec.push(rgba.r / 255);
    }
  }

  return normalizeVector(vec);
}

export function hammingDistance(bitsA: string, bitsB: string): number {
  const len = Math.min(bitsA.length, bitsB.length);
  let distance = Math.abs(bitsA.length - bitsB.length);

  for (let i = 0; i < len; i += 1) {
    if (bitsA[i] !== bitsB[i]) {
      distance += 1;
    }
  }

  return distance;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const len = Math.min(vecA.length, vecB.length);
  if (!len) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < len; i += 1) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function analyzeLivePhoto(input: LivePhotoInput): Promise<LivePhotoAnalysis> {
  const { mimeType, imageBuffer } = decodeImageDataUrl(input.imageDataUrl);

  const exif = extractExifMetadata(imageBuffer);
  const image = await Jimp.read(imageBuffer);

  const pHashBits = buildAverageHashBits(image);
  const embedding = buildEmbedding(image);

  const capturedAtMs =
    exif.exifTimestampMs ??
    (typeof input.clientCapturedAt === "number" ? input.clientCapturedAt : Date.now());

  return {
    mimeType,
    byteSize: imageBuffer.byteLength,
    pHashBits,
    embedding,
    exifTimestampMs: exif.exifTimestampMs,
    gps: exif.gps,
    capturedAtMs,
    captureMode: input.captureMode || "unknown",
  };
}
import type { PortraitFrame } from "./types";

/*
 * Retrato da ficha. A imagem fica dentro da própria ficha (data URL), reduzida e comprimida no navegador:
 * assim vai junto ao exportar/importar e não precisa de armazenamento à parte no Supabase.
 */

export const DEFAULT_FRAME: PortraitFrame = { zoom: 1, x: 50, y: 50 };
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;

const MAX_INPUT = 15 * 1024 * 1024;
// Cobre um quadro 3:4 de 480×640 sem passar de 1000 px no lado maior.
const BOX_W = 480;
const BOX_H = 640;
const MAX_SIDE = 1000;
// Teto do texto salvo (~110 KB de imagem), para a ficha continuar leve a cada salvamento.
const MAX_URL = 150_000;

export const clampFrame = (f: PortraitFrame): PortraitFrame => ({
  zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, f.zoom)),
  x: Math.min(100, Math.max(0, f.x)),
  y: Math.min(100, Math.max(0, f.y)),
});

/** Lê a imagem escolhida, reduz e devolve como data URL (WebP; JPEG onde o navegador não gera WebP). */
export async function fileToPortrait(file: Blob): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Esse arquivo não é uma imagem.");
  if (file.size > MAX_INPUT) throw new Error("Imagem grande demais (máximo 15 MB).");
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error("Não deu para abrir essa imagem. Tente PNG, JPG ou WebP.");
  }
  try {
    let scale = Math.min(1, Math.max(BOX_W / bmp.width, BOX_H / bmp.height), MAX_SIDE / Math.max(bmp.width, bmp.height));
    // Imagem muito detalhada: diminui um pouco e tenta de novo.
    for (let i = 0; i < 5; i++, scale *= 0.8) {
      const url = encode(bmp, scale);
      if (url) return url;
    }
  } finally {
    bmp.close();
  }
  throw new Error("Não deu para reduzir essa imagem o suficiente. Tente uma menor.");
}

function encode(bmp: ImageBitmap, scale: number): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);

  for (const q of [0.85, 0.72, 0.6]) {
    const url = canvas.toDataURL("image/webp", q);
    if (!url.startsWith("data:image/webp")) break; // navegador sem WebP: vai de JPEG
    if (url.length <= MAX_URL) return url;
  }
  // JPEG não tem transparência: fundo da ficha atrás do que for transparente.
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#2a221a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const q of [0.8, 0.65]) {
    const url = canvas.toDataURL("image/jpeg", q);
    if (url.length <= MAX_URL) return url;
  }
  return null;
}

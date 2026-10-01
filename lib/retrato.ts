import { currentUserId, supabase } from "./supabase/client";
import type { PortraitFrame } from "./types";

/*
 * Retrato da ficha. A imagem é reduzida e comprimida no navegador e vai para o Supabase Storage
 * (bucket "retratos"); a ficha guarda só o endereço. Assim a lista de fichas continua leve e o
 * navegador baixa cada imagem uma vez só (nome único por envio, cache de um ano).
 * No arquivo exportado a imagem volta para dentro da ficha (data URL), e a importação a envia de novo.
 * Ficha antiga, ou envio que falhou, ainda pode ter a data URL: ela aparece normal e é movida depois.
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

/* ---------------- Storage ---------------- */

const BUCKET = "retratos";
const PUBLIC_MARK = `/storage/v1/object/public/${BUCKET}/`;

/** Imagem ainda dentro da ficha (antiga, importada ou envio que falhou). */
export const isEmbedded = (src: string | undefined): src is string => Boolean(src?.startsWith("data:"));

/** Caminho do arquivo no bucket, se o endereço for um retrato enviado por este site. */
function storagePath(src: string): string | null {
  const i = src.indexOf(PUBLIC_MARK);
  return i < 0 ? null : decodeURIComponent(src.slice(i + PUBLIC_MARK.length));
}

/** Envia a imagem (data URL) para a pasta da conta e devolve o endereço público. */
export async function uploadPortrait(dataUrl: string): Promise<string> {
  const userId = await currentUserId();
  if (!userId) throw new Error("Entre na sua conta para enviar o retrato.");
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/jpeg" ? "jpg" : "webp";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const bucket = supabase().storage.from(BUCKET);
  // Nome novo a cada envio: o arquivo nunca muda, então pode ficar em cache por um ano.
  const { error } = await bucket.upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Apaga do bucket um retrato que nenhuma ficha usa mais. Falha em silêncio: no pior caso sobra um arquivo. */
export function deletePortrait(src: string) {
  const path = storagePath(src);
  if (path) void supabase().storage.from(BUCKET).remove([path]);
}

/** Para exportar: traz a imagem de volta para dentro da ficha. Sem rede, mantém o endereço. */
export async function embedPortrait(src: string): Promise<string> {
  if (isEmbedded(src)) return src;
  try {
    const res = await fetch(src);
    if (!res.ok) return src;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

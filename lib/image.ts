/**
 * 拍照后的客户端压缩:长边 1600px、JPEG 0.8,通常 200–500KB。
 * 原图(3–12MB)既浪费上传流量也浪费 Storage 额度;
 * 同时把 HEIC 等格式统一转成 JPEG,规避兼容问题。
 */
export interface CompressedPhoto {
  /** 不含 data: 前缀的 base64 */
  base64: string;
  mimeType: "image/jpeg";
  /** 可直接给 <img src> 的 data URL */
  dataUrl: string;
}

const MAX_SIDE = 1600;
const QUALITY = 0.8;

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  const img = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight)
  );
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("图片处理失败:浏览器不支持 canvas");
  ctx.drawImage(img, 0, 0, w, h);

  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("图片压缩失败,换一张试试");
  return { base64, mimeType: "image/jpeg", dataUrl };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败,换一张试试"));
    };
    img.src = url;
  });
}

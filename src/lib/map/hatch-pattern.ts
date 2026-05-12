/**
 * 8x8 transparent ImageData with a 1px diagonal stripe.
 * Used as MapLibre fill-pattern on the estimated layer to mark provenance
 * with a non-color channel (per DESIGN color-blindness contract).
 */
export function makeHatchImageData(): ImageData {
  const size = 8;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'oklch(0.20 0.012 260 / 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);
  ctx.moveTo(-1, 1);
  ctx.lineTo(1, -1);
  ctx.moveTo(size - 1, size + 1);
  ctx.lineTo(size + 1, size - 1);
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

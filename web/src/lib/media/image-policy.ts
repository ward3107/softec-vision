/** Originals accepted by the editor; prepared files fit two locales in one 4 MB action. */
export const MAX_ORIGINAL_IMAGE_BYTES = 6 * 1024 * 1024;
export const MAX_PREPARED_IMAGE_BYTES = Math.floor(1.4 * 1024 * 1024);
export const MAX_IMAGE_DIMENSION = 2560;
export const MAX_IMAGE_PIXELS = 40_000_000;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',');

export const IMAGE_ERRORS = {
  noFile: 'בחרו תמונה שאינה ריקה.',
  tooLarge: 'התמונה גדולה מדי. ניתן לבחור תמונה עד 6MB.',
  badType: 'בחרו תמונת JPG, PNG או WebP תקינה.',
  dimensions: 'רזולוציית התמונה גבוהה מדי. בחרו תמונה עד 40 מגה־פיקסל.',
  preparation: 'לא ניתן להכין את התמונה להעלאה. נסו תמונה קטנה יותר או דפדפן מעודכן.'
} as const;

export function fitImage(width: number, height: number, limit = MAX_IMAGE_DIMENSION) {
  const scale = Math.min(1, limit / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

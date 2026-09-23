import { describe, expect, it } from 'vitest';
import { publicMediaUrl, sanitizeCodeForPath } from './media';

describe('publicMediaUrl', () => {
  it('builds the public storage URL for a path', () => {
    expect(publicMediaUrl('https://proj.supabase.co', 'X-1/image-1.webp')).toBe(
      'https://proj.supabase.co/storage/v1/object/public/product-media/X-1/image-1.webp'
    );
  });

  it('tolerates a trailing slash on the project URL', () => {
    expect(publicMediaUrl('https://proj.supabase.co/', 'X-1/image-1.webp')).toBe(
      'https://proj.supabase.co/storage/v1/object/public/product-media/X-1/image-1.webp'
    );
  });
});

describe('sanitizeCodeForPath', () => {
  it('passes through a normal product code unchanged', () => {
    expect(sanitizeCodeForPath('LS-1000LPT')).toBe('LS-1000LPT');
  });

  it('strips anything that is not alphanumeric, hyphen or underscore', () => {
    expect(sanitizeCodeForPath('../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeCodeForPath('X 1/../Y')).toBe('X1Y');
  });

  it('rejects a code that sanitizes to nothing', () => {
    expect(() => sanitizeCodeForPath('../../')).toThrow();
  });
});

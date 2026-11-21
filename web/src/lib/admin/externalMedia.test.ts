import { describe, it, expect } from 'vitest';
import { validateExternalMedia } from './externalMedia';
import { publicMediaUrl, publicVideoUrl } from '../catalog/media';
describe('external media URLs', () => {
  it.each([
    ['image','https://cdn.example.com/file.JPG?version=2'],
    ['gallery','https://cdn.example.com/file.webp'],
    ['video','https://cdn.example.com/file.mp4']
  ])('accepts direct %s links without rewriting them', (kind,url) => expect(validateExternalMedia(kind,url)).toBe(url));
  it.each(['javascript:alert(1)','http://example.com/a.jpg','https://user:secret@example.com/a.jpg','https://127.0.0.1/a.jpg','https://localhost/a.jpg','https://host.internal/a.jpg','https://example.com:8443/a.jpg','https://example.com/a.jpg#fragment','https://example.com/a.svg','https://example.com/a.mp4','https://youtube.com/watch?v=x'])('rejects unsafe or incompatible image URL %s', url => expect(validateExternalMedia('image',url)).toBeNull());
  it('does not treat a remote URL as an owned storage path', () => {
    expect(publicMediaUrl('https://project.supabase.co','https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
    expect(publicVideoUrl('https://project.supabase.co','https://cdn.example.com/a.mp4')).toBe('https://cdn.example.com/a.mp4');
  });
  it('rejects external models', () => expect(validateExternalMedia('model','https://cdn.example.com/a.glb')).toBeNull());
});

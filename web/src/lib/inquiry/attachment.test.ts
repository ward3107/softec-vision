import { describe, expect, it } from 'vitest';
import { checkAttachment, isGlb, MAX_ATTACHMENT_BYTES, safeFilename, sniffType } from './attachment';

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
const PDF = bytes(...ascii('%PDF-1.7\n'));
const WEBP = bytes(...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBPVP8 '));
const HEIC = bytes(0, 0, 0, 0x18, ...ascii('ftypheic'), 0, 0);
const EXE = bytes(0x4d, 0x5a, 0x90, 0x00);

describe('sniffType', () => {
  it('recognises supported formats by their content, not their name', () => {
    expect(sniffType(JPEG)).toBe('image/jpeg');
    expect(sniffType(PNG)).toBe('image/png');
    expect(sniffType(PDF)).toBe('application/pdf');
    expect(sniffType(WEBP)).toBe('image/webp');
    expect(sniffType(HEIC)).toBe('image/heic');
  });

  it('returns null for anything else', () => {
    expect(sniffType(EXE)).toBeNull();
    expect(sniffType(bytes())).toBeNull();
  });
});

describe('checkAttachment', () => {
  it('accepts a supported file within the size limit', () => {
    expect(checkAttachment({ name: 'room.jpg', size: 1000, bytes: JPEG })).toEqual({
      ok: true,
      mime: 'image/jpeg',
      ext: 'jpg'
    });
  });

  it('rejects a disguised executable even with an allowed extension', () => {
    expect(checkAttachment({ name: 'plan.pdf', size: 4, bytes: EXE })).toEqual({ ok: false, error: 'badType' });
  });

  it('rejects files over the limit', () => {
    expect(checkAttachment({ name: 'big.png', size: MAX_ATTACHMENT_BYTES + 1, bytes: PNG })).toEqual({
      ok: false,
      error: 'tooLarge'
    });
  });

  it('keeps the limit under the hosting platform request cap', () => {
    expect(MAX_ATTACHMENT_BYTES).toBeLessThanOrEqual(4 * 1024 * 1024);
  });
});

describe('isGlb', () => {
  const GLB = bytes(...ascii('glTF'), 2, 0, 0, 0, 0, 0, 0, 0);

  it('recognises a valid glTF Binary header (magic + version 2)', () => {
    expect(isGlb(GLB)).toBe(true);
  });

  it('rejects other version numbers and non-glb content', () => {
    expect(isGlb(bytes(...ascii('glTF'), 1, 0, 0, 0))).toBe(false);
    expect(isGlb(JPEG)).toBe(false);
    expect(isGlb(bytes())).toBe(false);
  });
});

describe('safeFilename', () => {
  it('strips paths and unsafe characters and caps length', () => {
    expect(safeFilename('../../etc/passwd')).toBe('passwd');
    expect(safeFilename('C:\\Users\\me\\Room plan (v2).pdf')).toBe('Room plan (v2).pdf');
    expect(safeFilename('a<b>"c".png')).toBe('abc.png');
    expect(safeFilename('x'.repeat(300) + '.jpg').length).toBeLessThanOrEqual(120);
    expect(safeFilename('')).toBe('attachment');
  });
});

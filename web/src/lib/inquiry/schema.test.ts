import { describe, expect, it } from 'vitest';
import { inquiryFromFormData, validateInquiry, PROJECT_TYPES } from './schema';

const valid = {
  name: 'Dana Levi',
  company: 'Example University',
  email: 'dana@example.com',
  phone: '+972 54-123-4567',
  country: 'Israel',
  projectType: 'lecture-hall',
  product: 'RAV-500',
  roomDimensions: '8 x 12 m',
  requirements: 'Two accessible lecturer stations for a 120-seat hall.',
  consent: true,
  locale: 'en'
};

describe('validateInquiry', () => {
  it('accepts a complete, valid request and trims values', () => {
    const result = validateInquiry({ ...valid, name: '  Dana Levi  ' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe('Dana Levi');
  });

  it('accepts the minimum required fields only', () => {
    const { company, projectType, product, roomDimensions, ...required } = valid;
    void company; void projectType; void product; void roomDimensions;
    const result = validateInquiry(required);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.company).toBe('');
      expect(result.data.projectType).toBe('');
    }
  });

  it('reports every missing required field by name', () => {
    const result = validateInquiry({ locale: 'he' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(
        ['consent', 'country', 'email', 'name', 'phone', 'requirements'].sort()
      );
      expect(result.errors.name).toBe('required');
      expect(result.errors.consent).toBe('consentRequired');
    }
  });

  it('rejects malformed email and phone numbers', () => {
    const result = validateInquiry({ ...valid, email: 'not-an-email', phone: 'call me' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.email).toBe('invalidEmail');
      expect(result.errors.phone).toBe('invalidPhone');
    }
  });

  it('requires at least six digits in a phone number', () => {
    const result = validateInquiry({ ...valid, phone: '+1 (2)' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.phone).toBe('invalidPhone');
  });

  it('requires explicit privacy consent', () => {
    const result = validateInquiry({ ...valid, consent: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.consent).toBe('consentRequired');
  });

  it('rejects unknown project types and oversized text', () => {
    const result = validateInquiry({ ...valid, projectType: 'spaceship', requirements: 'x'.repeat(4001) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.projectType).toBe('invalid');
      expect(result.errors.requirements).toBe('tooLong');
    }
  });

  it('asks for a meaningful description of the requirement', () => {
    const result = validateInquiry({ ...valid, requirements: 'hi' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.requirements).toBe('tooShort');
  });

  it('offers the sectors the business serves as project types', () => {
    expect(PROJECT_TYPES).toContain('lecture-hall');
    expect(PROJECT_TYPES).toContain('control-room');
    expect(PROJECT_TYPES).toContain('other');
  });
});

describe('inquiryFromFormData', () => {
  it('maps form fields, turning the consent checkbox into a boolean', () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(valid)) if (k !== 'consent') fd.set(k, String(v));
    fd.set('consent', 'on');
    const raw = inquiryFromFormData(fd);
    expect(raw.consent).toBe(true);
    expect(validateInquiry(raw).ok).toBe(true);
  });

  it('treats a missing consent checkbox as not consenting', () => {
    const fd = new FormData();
    fd.set('name', 'Dana');
    expect(inquiryFromFormData(fd).consent).toBe(false);
  });
});

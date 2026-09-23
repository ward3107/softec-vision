import { z } from 'zod';

/**
 * Quote-request validation, shared by the browser (instant feedback) and the
 * server (the authority). Error messages are translation keys under
 * `form.errors` so each locale renders its own wording.
 */

export const PROJECT_TYPES = [
  'lecture-hall',
  'classroom',
  'meeting-room',
  'control-room',
  'exhibition',
  'industrial',
  'other'
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const MAX_REQUIREMENTS = 4000;

const digitCount = (value: string) => (value.match(/\d/g) ?? []).length;

const optionalText = (max: number) => z.string().trim().max(max, 'tooLong').optional().default('');

export const inquirySchema = z.object({
  name: z.string({ required_error: 'required' }).trim().min(2, 'required').max(120, 'tooLong'),
  company: optionalText(160),
  email: z
    .string({ required_error: 'required' })
    .trim()
    .min(1, 'required')
    .max(200, 'tooLong')
    .email('invalidEmail'),
  phone: z
    .string({ required_error: 'required' })
    .trim()
    .min(1, 'required')
    .max(32, 'tooLong')
    .regex(/^\+?[\d\s().-]+$/, 'invalidPhone')
    .refine((value) => digitCount(value) >= 6, 'invalidPhone'),
  country: z.string({ required_error: 'required' }).trim().min(2, 'required').max(80, 'tooLong'),
  projectType: z
    .union([z.enum(PROJECT_TYPES), z.literal('')], { errorMap: () => ({ message: 'invalid' }) })
    .optional()
    .default(''),
  product: optionalText(40),
  roomDimensions: optionalText(200),
  requirements: z
    .string({ required_error: 'required' })
    .trim()
    .min(1, 'required')
    .min(10, 'tooShort')
    .max(MAX_REQUIREMENTS, 'tooLong'),
  consent: z.literal(true, { errorMap: () => ({ message: 'consentRequired' }) }),
  locale: z.enum(['he', 'en'])
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type InquiryErrors = Partial<Record<keyof InquiryInput | 'attachment', string>>;

export type ValidationResult = { ok: true; data: InquiryInput } | { ok: false; errors: InquiryErrors };

/** Validate raw input; on failure, return the first error key per field. */
export function validateInquiry(raw: unknown): ValidationResult {
  const parsed = inquirySchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: InquiryErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof InquiryErrors | undefined;
    if (field && !errors[field]) {
      // A field that is absent entirely surfaces as a type error; treat it as "required".
      errors[field] = issue.code === 'invalid_type' && field !== 'consent' ? 'required' : issue.message;
    }
  }
  return { ok: false, errors };
}

const FIELDS = [
  'name',
  'company',
  'email',
  'phone',
  'country',
  'projectType',
  'product',
  'roomDimensions',
  'requirements',
  'locale'
] as const;

/** Read the form's fields into the shape `validateInquiry` expects. */
export function inquiryFromFormData(fd: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const key of FIELDS) {
    const value = fd.get(key);
    if (typeof value === 'string') raw[key] = value;
  }
  const consent = fd.get('consent');
  raw.consent = consent === 'on' || consent === 'true';
  return raw;
}

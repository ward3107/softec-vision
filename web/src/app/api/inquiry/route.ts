import { NextResponse, type NextRequest } from 'next/server';
import { getInquiryConfig } from '@/lib/inquiry/config';
import { createInquiryDeps } from '@/lib/inquiry/server';
import { isSameOrigin, signFormToken } from '@/lib/inquiry/spam';
import { submitInquiry } from '@/lib/inquiry/submit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const MAX_BODY_BYTES = 4.5 * 1024 * 1024;

/** Issue a signed form token (fetched when the visitor starts the form). */
export async function GET() {
  const config = getInquiryConfig();
  if (!config.onlineEnabled) {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true, token: signFormToken(Date.now(), config.secret) }, { headers: NO_STORE });
}

/** Receive a quote request (multipart form data, optional attachment). */
export async function POST(request: NextRequest) {
  const config = getInquiryConfig();
  if (!config.onlineEnabled) {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503, headers: NO_STORE });
  }
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403, headers: NO_STORE });
  }
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, errors: { attachment: 'tooLarge' } }, { status: 413, headers: NO_STORE });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 400, headers: NO_STORE });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const result = await submitInquiry(
    form,
    { ip, userAgent: request.headers.get('user-agent') ?? '', now: Date.now() },
    createInquiryDeps(config)
  );
  return NextResponse.json(result.body, { status: result.status, headers: NO_STORE });
}

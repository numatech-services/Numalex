// ============================================================
// NumaLex — Healthcheck endpoint
// GET /api/health — Vérifie que l'app et la DB sont vivantes
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const start = Date.now();
  const checks: Record<string, 'ok' | 'fail'> = {};

  // 1. App
  checks.app = 'ok';

  // 2. Database
  try {
    const supabase = createClient();
    const { error } = await supabase.from('cabinets').select('id').limit(1);
    checks.database = error ? 'fail' : 'ok';
  } catch {
    checks.database = 'fail';
  }

  // 3. Environment
  checks.env = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'fail';

  const allOk = Object.values(checks).every((v) => v === 'ok');
  const latencyMs = Date.now() - start;

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      latencyMs,
      checks,
      version: process.env.npm_package_version ?? '0.1.0',
    },
    { status: allOk ? 200 : 503 }
  );
}

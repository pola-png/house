import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const secret = process.env.REVALIDATE_SECRET;
    const headerToken = request.headers.get('x-revalidate-token') || '';
    let authorized = false;

    // Path A: shared secret header (for server automation)
    if (secret && headerToken === secret) authorized = true;

    // Path B: Authorization: Bearer <access_token> for authenticated users
    if (!authorized) {
      const authz = request.headers.get('authorization') || '';
      const bearer = authz.startsWith('Bearer ') ? authz.slice(7) : '';
      if (!authorized && bearer) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
        if (url && anon) {
          const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
          const { data: userRes } = await supabase.auth.getUser(bearer);
          const user = userRes?.user;
          if (user) {
            // Require admin role
            const { data: prof } = await supabaseAdmin
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();
            if (prof?.role === 'admin') authorized = true;
          }
        }
      }
    }

    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const tags = Array.isArray(body?.tags) ? body.tags as string[] : [];
    if (tags.length === 0) {
      return NextResponse.json({ ok: false, error: 'No tags provided' }, { status: 400 });
    }

    // Allow only a safe subset of tags
    const allowed = tags.filter((t) => t === 'properties:list' || t.startsWith('property:'));
    for (const t of allowed) revalidateTag(t);
    return NextResponse.json({ ok: true, revalidated: allowed });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'revalidate failed' }, { status: 500 });
  }
}

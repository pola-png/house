import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type Body = {
  subject?: string
  message?: string
  email?: string
  phone?: string
  priority?: 'low' | 'normal' | 'high'
  attachments?: any[]
}

async function getUserFromBearer(request: Request) {
  try {
    const authz = request.headers.get('authorization') || ''
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
    if (!token) return null
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    if (!url || !anon) return null
    const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data } = await supabase.auth.getUser(token)
    return data?.user || null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    let body: Body = {}
    const ct = request.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      body = (await request.json()) as Body
    } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const fd = await request.formData()
      body = {
        subject: String(fd.get('subject') || ''),
        message: String(fd.get('message') || ''),
        email: String(fd.get('email') || ''),
        phone: String(fd.get('phone') || ''),
        priority: (String(fd.get('priority') || 'normal') as any),
      }
      const rawAtt = fd.get('attachments')
      if (rawAtt) {
        try { body.attachments = JSON.parse(String(rawAtt)) } catch { body.attachments = [] }
      }
    } else {
      // Best effort JSON parse; if empty, keep body {}
      try { body = (await request.json()) as Body } catch {}
    }

    const subject = (body.subject || '').trim()
    const message = (body.message || '').trim()
    const email = (body.email || '').trim() || null
    const phone = (body.phone || '').trim() || null
    const priority = (body.priority || 'normal') as 'low' | 'normal' | 'high'
    const attachments = Array.isArray(body.attachments) ? body.attachments : []

    if (subject.length < 3 || message.length < 10) {
      return NextResponse.json({ error: 'Invalid input: provide subject (>=3) and message (>=10).' }, { status: 400 })
    }
    if (!email) {
      // If user is not authenticated, email is required for follow-up
      const user = await getUserFromBearer(request)
      if (!user) {
        return NextResponse.json({ error: 'Email required for anonymous support request.' }, { status: 400 })
      }
    }

    const user = await getUserFromBearer(request)
    const userId = user?.id || null

    // Insert via service key to avoid client‑side RLS complexity
    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert([{
        user_id: userId,
        userId: userId as any,
        email,
        phone,
        subject,
        message: message || '',
        lastMessage: message || '',
        priority,
        attachments,
        status: 'open',
        created_at: now,
        updated_at: now,
        createdAt: now as any,
        updatedAt: now as any,
      }])
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }

    return NextResponse.json({ ok: true, ticket: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type SaveBody = {
  id?: string
  title: string
  description?: string
  price: number | string
  propertyType: string
  bedrooms?: number | string
  bathrooms?: number | string
  area?: number | string
  location?: string
  city?: string
  latitude?: number | string
  longitude?: number | string
  images?: string[]
  amenities?: string[]
  landlordId?: string
  status?: string
  featured?: boolean
  keywords?: string
}

const toNumber = (v: any, fallback = 0) => {
  if (typeof v === 'number') return v
  const n = Number(String(v ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : fallback
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    if (!anonUrl || !anonKey) {
      return NextResponse.json({ error: 'Server misconfigured: missing Supabase envs' }, { status: 500 })
    }

    // Verify caller identity via Supabase Auth using the provided bearer token
    const authz = req.headers.get('authorization') || ''
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(anonUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: userRes, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userRes?.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    const user = userRes.user

    const body = (await req.json()) as SaveBody
    if (!body || !body.title || !body.propertyType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Determine if caller is admin
    let isAdmin = false
    try {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = (prof?.role === 'admin')
    } catch {}

    // Build payload; enforce landlordId = current user unless admin explicitly sets it
    const landlordId = isAdmin ? (body.landlordId || user.id) : user.id

    const payload: any = {
      title: body.title,
      description: body.description ?? '',
      price: toNumber(body.price, 0),
      propertyType: body.propertyType,
      bedrooms: toNumber(body.bedrooms, 1),
      bathrooms: toNumber(body.bathrooms, 1),
      area: toNumber(body.area, 0),
      location: body.location || '',
      city: body.city || '',
      latitude: toNumber(body.latitude, -1.286389),
      longitude: toNumber(body.longitude, 36.817223),
      images: Array.isArray(body.images) ? body.images : [],
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      landlordId,
      status: body.status || 'For Rent',
      featured: Boolean(body.featured),
      keywords: body.keywords || '',
    }

    let row: any
    if (body.id) {
      // Update; if not admin, assert ownership
      if (!isAdmin) {
        const { data: existing, error: exErr } = await supabaseAdmin
          .from('properties')
          .select('id, landlordId')
          .eq('id', body.id)
          .single()
        if (exErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (existing.landlordId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const { data, error } = await supabaseAdmin
        .from('properties')
        .update({ ...payload, updatedAt: new Date().toISOString() })
        .eq('id', body.id)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message, details: error.details, hint: error.hint, code: error.code }, { status: 400 })
      row = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('properties')
        .insert([{ ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message, details: error.details, hint: error.hint, code: error.code }, { status: 400 })
      row = data
    }

    const res = NextResponse.json(row)
    res.headers.set('Cache-Control', 'no-store, max-age=0')
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Save error' }, { status: 500 })
  }
}

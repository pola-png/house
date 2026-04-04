import { NextResponse } from 'next/server';

import { buildStaticSitemapEntries, getPropertySitemapEntries, renderUrlSetXml } from '@/lib/sitemap';

export async function GET() {
  const xml = renderUrlSetXml([...buildStaticSitemapEntries(), ...(await getPropertySitemapEntries())]);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

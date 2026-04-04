import { NextResponse } from 'next/server';

import { buildStaticSitemapEntries, renderUrlSetXml } from '@/lib/sitemap';

export async function GET() {
  const xml = renderUrlSetXml(buildStaticSitemapEntries());

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

import { NextResponse } from 'next/server';

import { BRAND } from '@/lib/brand';
import { getPropertySitemapPageCount, renderSitemapIndexXml } from '@/lib/sitemap';

export async function GET() {
  const propertyPageCount = await getPropertySitemapPageCount();
  const now = new Date();

  const sitemaps = [
    {
      url: `${BRAND.siteUrl}/sitemaps/static`,
      lastModified: now,
    },
    ...Array.from({ length: propertyPageCount }, (_, index) => ({
      url: `${BRAND.siteUrl}/sitemaps/properties/${index + 1}`,
      lastModified: now,
    })),
  ];

  const xml = renderSitemapIndexXml(sitemaps);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

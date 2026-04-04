import { NextResponse } from 'next/server';

import { getPropertySitemapEntries, getPropertySitemapPageCount, renderUrlSetXml } from '@/lib/sitemap';

export async function GET(
  _request: Request,
  context: { params: Promise<{ page: string }> }
) {
  const { page } = await context.params;
  const pageNumber = Number.parseInt(page, 10);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return new NextResponse('Invalid sitemap page', { status: 400 });
  }

  const maxPage = await getPropertySitemapPageCount();
  if (pageNumber > maxPage) {
    return new NextResponse('Sitemap page not found', { status: 404 });
  }

  const xml = renderUrlSetXml(await getPropertySitemapEntries(pageNumber));

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

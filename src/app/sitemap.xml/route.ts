import { buildSitemapXml, getSitemapEntries } from '@/lib/sitemap';

export async function GET() {
  const entries = await getSitemapEntries();
  const xml = buildSitemapXml(entries);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

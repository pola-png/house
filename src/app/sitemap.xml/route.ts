import { buildStaticSitemapEntries, getPropertySitemapEntries, renderUrlSetXml } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [staticEntries, propertyEntries] = await Promise.all([
    buildStaticSitemapEntries(),
    getPropertySitemapEntries(),
  ]);

  const xml = renderUrlSetXml([...staticEntries, ...propertyEntries]);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

import { supabase } from '@/lib/supabase';
import { createPropertyUrl } from '@/lib/utils-seo';

export async function GET() {
  try {
    const batchSize = 1000;
    const properties: Array<{ id: string; title: string; updatedAt: string; isPremium?: boolean | null; status: string }> = [];

    let from = 0;
    while (true) {
      const to = from + batchSize - 1;
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, updatedAt, isPremium, status')
        .in('status', ['Available', 'For Rent', 'For Sale'])
        .order('updatedAt', { ascending: false })
        .range(from, to);

      if (error || !data || data.length === 0) {
        break;
      }

      properties.push(...data);

      if (data.length < batchSize) {
        break;
      }

      from += batchSize;
    }

    if (properties.length === 0) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${properties
  .map((property) => {
    const url = createPropertyUrl(property.id, property.title || property.id);
    const lastmod = new Date(property.updatedAt).toISOString();
    const priority = property.isPremium ? '0.9' : '0.7';
    
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

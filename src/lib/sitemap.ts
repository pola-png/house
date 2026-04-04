import { BRAND } from '@/lib/brand';
import { COUNTRIES, slugifyCountry } from '@/lib/countries';
import { supabase } from '@/lib/supabase';
import { createPropertyUrl } from '@/lib/utils-seo';

export const SITEMAP_PROPERTY_PAGE_SIZE = 50000;

type SitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: string[];
};

type PropertySitemapRow = {
  id: string;
  title: string;
  updatedAt: string | null;
  images: unknown;
};

export function createPropertyCanonicalUrl(id: string, title: string): string {
  return `${BRAND.siteUrl}${createPropertyUrl(id, title)}`;
}

export function buildStaticSitemapEntries(): SitemapEntry[] {
  const baseUrl = BRAND.siteUrl;

  const staticPages: SitemapEntry[] = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/agents`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/developments`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/advice`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  const seoPages: SitemapEntry[] = [
    { url: `${baseUrl}/rentals-worldwide`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/family-homes-for-rent`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/city-properties`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/budget-rentals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/1-bedroom-homes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/2-bedroom-homes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/3-bedroom-homes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/countries`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/houses-for-sale`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/homes-for-sale`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/property-for-sale`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/real-estate-for-sale`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/real-estate-agents-near-me`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/buy-a-house`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/new-homes-for-sale`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/real-estate-listings`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/realtor-near-me`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/nairobi-properties`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/house-rent-in-kenya`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/house-rent-in-nairobi`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/houses-for-rent-in-kenya`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/1-bedroom-in-kenya`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/1-bedroom-for-rent-in-kenya`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/2-bedroom-rent-in-kenya`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/3-bedroom-rent-in-kenya`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/bedsitter-for-rent-in-kasarani`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/1-bedroom-house-for-rent-in-kisumu`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/2-bedroom-house-for-rent-in-mombasa`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/3-bedroom-house-for-rent-in-meru`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  const countryPages: SitemapEntry[] = COUNTRIES.map((country) => ({
    url: `${baseUrl}/countries/${slugifyCountry(country)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...seoPages, ...countryPages];
}

export async function getPropertySitemapEntries(): Promise<SitemapEntry[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, updatedAt, images')
    .in('status', ['Available', 'For Rent', 'For Sale'])
    .order('updatedAt', { ascending: false })
    .limit(SITEMAP_PROPERTY_PAGE_SIZE);

  if (error || !data) {
    if (error) {
      throw error;
    }
    return [];
  }

  const rows = data as PropertySitemapRow[];

  return rows.map((property) => ({
    url: createPropertyCanonicalUrl(property.id, property.title),
    lastModified: property.updatedAt ? new Date(property.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
    images: Array.isArray(property.images) ? property.images.slice(0, 3) : [],
  }));
}

export function renderUrlSetXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : '';
      const changefreq = entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : '';
      const priority = typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(1)}</priority>` : '';
      const images = (entry.images || [])
        .filter(Boolean)
        .map((image) => `<image:image><image:loc>${image}</image:loc></image:image>`)
        .join('');

      return `  <url>
    <loc>${entry.url}</loc>
    ${lastmod}
    ${changefreq}
    ${priority}
    ${images}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>`;
}


import type { MetadataRoute } from 'next';

import { buildStaticSitemapEntries, getPropertySitemapEntries } from '@/lib/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticAndSeoPages = buildStaticSitemapEntries();
  const propertyPages = await getPropertySitemapEntries();
  return [...staticAndSeoPages, ...propertyPages];
}

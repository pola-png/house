import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { COUNTRIES, slugifyCountry } from '@/lib/countries';
import { BRAND } from '@/lib/brand';
import { SEO_SITEMAP_LINKS } from '@/lib/seo-pages';
import { createPropertyUrl } from '@/lib/utils-seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = BRAND.siteUrl;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/agents`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/developments`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/advice`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  // SEO landing pages
  const seoPages: MetadataRoute.Sitemap = SEO_SITEMAP_LINKS.map((page) => ({
    url: `${baseUrl}${page.href}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: page.href.includes('/agents') ? 0.8 : 0.9,
  }));

  // Country pages
  const countryPages: MetadataRoute.Sitemap = COUNTRIES.map((country) => ({
    url: `${baseUrl}/countries/${slugifyCountry(country)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Location-based search pages
  const locations = [
    'lagos', 'abuja', 'london', 'manchester', 'dubai', 'abu dhabi', 'new york',
    'toronto', 'vancouver', 'singapore', 'sydney', 'melbourne', 'johannesburg',
    'cape town', 'paris', 'berlin', 'madrid', 'rome', 'tokyo', 'bangkok',
    'mumbai', 'delhi', 'istanbul', 'doha', 'riyadh', 'nairobi', 'accra', 'bali',
  ];

  const locationPages: MetadataRoute.Sitemap = locations.map((location) => ({
    url: `${baseUrl}/search?q=${encodeURIComponent(location)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Property type pages
  const propertyTypes = ['apartment', 'house', 'studio', 'bedsitter', 'mansion', 'townhouse', 'villa', 'penthouse', 'condo'];

  const typePages: MetadataRoute.Sitemap = propertyTypes.map((type) => ({
    url: `${baseUrl}/search?property_type=${encodeURIComponent(type)}&type=rent`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Dynamic property pages — up to 50,000
  let propertyPages: MetadataRoute.Sitemap = [];

  try {
    const { data: properties } = await supabase
      .from('properties')
      .select('id, title, updatedAt, images')
      .in('status', ['Available', 'For Rent', 'For Sale'])
      .order('updatedAt', { ascending: false })
      .limit(50000);

    if (properties) {
      propertyPages = properties.map((property) => ({
        url: `${baseUrl}${createPropertyUrl(property.id, property.title)}`,
        lastModified: property.updatedAt ? new Date(property.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        images: Array.isArray(property.images) ? property.images.slice(0, 3) : [],
      }));
    }
  } catch (error) {
    console.error('Error generating property sitemap entries:', error);
  }

  return [...staticPages, ...seoPages, ...countryPages, ...locationPages, ...typePages, ...propertyPages];
}

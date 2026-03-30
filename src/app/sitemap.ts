import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { COUNTRIES, slugifyCountry } from '@/lib/countries';
import { BRAND } from '@/lib/brand';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = BRAND.siteUrl;
  const batchSize = 1000;
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/developments`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/advice`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // SEO-focused landing pages
  const seoPages = [
    {
      url: `${baseUrl}/rentals-worldwide`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/family-homes-for-rent`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/city-properties`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/budget-rentals`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/1-bedroom-homes`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/2-bedroom-homes`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/3-bedroom-homes`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/countries`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/houses-for-sale`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/homes-for-sale`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/property-for-sale`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/real-estate-for-sale`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/real-estate-agents-near-me`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // Dynamic property pages with images
  let propertyPages: MetadataRoute.Sitemap = [];
  
  try {
    const slug = (title: string) => title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);

    let from = 0;
    while (true) {
      const to = from + batchSize - 1;
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, updatedAt, status, images, location, city, bedrooms, propertyType')
        .in('status', ['Available', 'For Rent', 'For Sale'])
        .order('updatedAt', { ascending: false })
        .range(from, to);

      if (error || !properties || properties.length === 0) {
        break;
      }

      propertyPages.push(
        ...properties.map((property) => ({
          url: `${baseUrl}/property/${slug(property.title)}-${property.id}`,
          lastModified: new Date(property.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          images: property.images?.slice(0, 3) || [],
        }))
      );

      if (properties.length < batchSize) {
        break;
      }

      from += batchSize;
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // Location-based pages
  const locations = [
    'lagos', 'abuja', 'london', 'manchester', 'dubai', 'abu dhabi', 'new york',
    'toronto', 'vancouver', 'singapore', 'sydney', 'melbourne', 'johannesburg',
    'cape town', 'paris', 'berlin', 'madrid', 'rome', 'tokyo', 'bangkok',
    'mumbai', 'delhi', 'istanbul', 'doha', 'riyadh', 'nairobi', 'accra', 'bali'
  ];

  const locationPages = locations.map(location => ({
    url: `${baseUrl}/search?q=${encodeURIComponent(location)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Property type pages
  const propertyTypes = ['apartment', 'house', 'studio', 'bedsitter', 'mansion', 'townhouse', 'villa', 'penthouse', 'condo'];
  
  const typePages = propertyTypes.map(type => ({
    url: `${baseUrl}/search?property_type=${encodeURIComponent(type)}&amp;type=rent`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const countryPages = COUNTRIES.map((country) => ({
    url: `${baseUrl}/countries/${slugifyCountry(country)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...seoPages, ...countryPages, ...propertyPages, ...locationPages, ...typePages];
}

import { Metadata } from 'next';
import SearchPageClient from './search-client';
import { BRAND } from '@/lib/brand';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q as string;
  const type = params.type as string;
  const propertyType = params.property_type as string;
  const beds = params.beds as string;
  const hasFilters = Boolean(q || type || propertyType || beds);
  
  let title = `Property Search Results | ${BRAND.name}`;
  let description = `Find your perfect property anywhere with ${BRAND.name}`;
  
  if (q && propertyType && beds) {
    title = `${beds} Bedroom ${propertyType} for ${type || 'rent'} in ${q} | ${BRAND.name}`;
    description = `Find ${beds} bedroom ${propertyType.toLowerCase()} properties for ${type || 'rent'} in ${q}. Browse verified listings with photos, prices, and contact details.`;
  } else if (q && propertyType) {
    title = `${propertyType} for ${type || 'rent'} in ${q} | ${BRAND.name}`;
    description = `Find ${propertyType.toLowerCase()} properties for ${type || 'rent'} in ${q}. Verified listings with instant booking.`;
  } else if (q) {
    title = `Properties for ${type || 'rent'} in ${q} | ${BRAND.name}`;
    description = `Find properties for ${type || 'rent'} in ${q}. Browse apartments, houses, and homes with verified listings.`;
  } else if (propertyType) {
    title = `${propertyType} for ${type || 'rent'} | ${BRAND.name}`;
    description = `Find ${propertyType.toLowerCase()} properties for ${type || 'rent'} across multiple markets. Browse verified listings worldwide.`;
  }
  
  return {
    title,
    description,
    alternates: {
      canonical: `${BRAND.siteUrl}/search`,
    },
    robots: hasFilters
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title,
      description,
      url: `${BRAND.siteUrl}/search`
    },
    twitter: {
      card: 'summary',
      title,
      description
    }
  };
}

export default function SearchPage() {
  return <SearchPageClient />;
}

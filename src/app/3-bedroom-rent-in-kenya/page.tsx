import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { BRAND } from '@/lib/brand';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '3 Bedroom Houses for Rent in Kenya | Family Homes & Apartments',
  description: 'Find 3 bedroom houses and apartments for rent in Kenya. 1000+ verified family homes in Nairobi, Mombasa, Kisumu. Spacious properties for large families.',
  keywords: [
    '3 bedroom for rent Kenya',
    '3 bedroom houses Kenya',
    'three bedroom rental Kenya',
    '3BR family homes Kenya',
    '3 bedroom apartments Nairobi',
    'large family houses Kenya',
    '3 bedroom townhouses Kenya',
    'spacious homes for rent Kenya'
  ],
  openGraph: {
    title: '3 Bedroom Houses for Rent in Kenya | Family Properties',
    description: 'Discover spacious 3 bedroom family homes across Kenya. Perfect for large families with verified listings.',
    url: `${BRAND.siteUrl}/3-bedroom-rent-in-kenya`,
    type: 'website'
  },
  alternates: {
    canonical: `${BRAND.siteUrl}/3-bedroom-rent-in-kenya`
  }
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    bedrooms: 3,
    status: 'For Rent',
    limit: 20
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "3 Bedroom Houses for Rent in Kenya",
            "description": "Find spacious 3 bedroom family homes and apartments for rent across Kenya with verified listings.",
            "url": `${BRAND.siteUrl}/3-bedroom-rent-in-kenya`,
            "mainEntity": {
              "@type": "RealEstateAgent",
              "name": "House Rent Kenya",
              "areaServed": "Kenya",
              "serviceType": "3 Bedroom Family Home Rental"
            }
          })
        }}
      />
      
      <PromotedPropertiesLayout
        promoted={promoted}
        regular={regular}
        totalProperties={all.length}
        title="3 Bedroom Rent in Kenya - Family Homes"
        description={`Browse ${all.length}+ 3 bedroom properties for rent in Kenya. Spacious family homes perfect for large families in Nairobi, Mombasa, Kisumu and across the country.`}
        featuredSectionTitle="Featured Family Homes"
        regularSectionTitle="More 3 Bedroom Properties"
        viewAllLink="/search?beds=3&type=rent"
        viewAllText="View All 3 Bedroom Properties"
      />
    </>
  );
}

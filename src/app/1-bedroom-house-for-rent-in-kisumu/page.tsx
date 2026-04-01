import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { BRAND } from '@/lib/brand';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '1 Bedroom Apartments for Rent in Kisumu | Lakeside Properties',
  description: 'Find 1 bedroom apartments and houses for rent in Kisumu, Kenya. Lakeside properties with modern amenities. Perfect for singles and couples.',
  keywords: [
    '1 bedroom Kisumu',
    '1 bedroom apartments Kisumu',
    'bedsitter Kisumu',
    'single room Kisumu',
    'apartments for rent Kisumu',
    'lakeside properties Kisumu',
    '1BR rental Kisumu',
    'studio apartments Kisumu'
  ],
  openGraph: {
    title: '1 Bedroom Properties in Kisumu | Lakeside Living',
    description: 'Discover 1 bedroom apartments in Kisumu with beautiful lake views and modern amenities.',
    url: `${BRAND.siteUrl}/1-bedroom-house-for-rent-in-kisumu`,
    type: 'website'
  },
  alternates: {
    canonical: `${BRAND.siteUrl}/1-bedroom-house-for-rent-in-kisumu`
  }
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    location: 'kisumu',
    bedrooms: 1,
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
            "name": "1 Bedroom Apartments for Rent in Kisumu",
            "description": "Find 1 bedroom apartments and houses for rent in Kisumu, Kenya with lakeside views and modern amenities.",
            "url": `${BRAND.siteUrl}/1-bedroom-house-for-rent-in-kisumu`,
            "mainEntity": {
              "@type": "RealEstateAgent",
              "name": "House Rent Kenya",
              "areaServed": "Kisumu, Kenya",
              "serviceType": "1 Bedroom Property Rental"
            }
          })
        }}
      />
      
      <PromotedPropertiesLayout
        promoted={promoted}
        regular={regular}
        totalProperties={all.length}
        title="1 Bedroom House for Rent in Kisumu"
        description={`Find ${all.length}+ 1 bedroom properties for rent in Kisumu. Affordable lakeside living with modern amenities in Kenya's third-largest city.`}
        featuredSectionTitle="Featured Properties in Kisumu"
        regularSectionTitle="More Properties in Kisumu"
        viewAllLink="/search?q=kisumu&beds=1"
        viewAllText="View All Kisumu Properties"
      />
    </>
  );
}

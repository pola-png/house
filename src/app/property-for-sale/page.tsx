import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Property for Sale Worldwide | ${BRAND.name}`,
  description: 'Browse land, houses, apartments, and commercial property for sale across global markets.',
  keywords: [
    'property for sale',
    'real estate for sale',
    'land for sale',
    'commercial property',
    'investment property',
    'buy property',
    'property investment',
    'real estate investment',
    'property deals'
  ],
  openGraph: {
    title: `Property for Sale Worldwide | ${BRAND.name}`,
    description: 'Discover premium property investment opportunities with verified listings across global markets.',
    url: `${BRAND.siteUrl}/property-for-sale`,
    type: 'website'
  },
  alternates: {
    canonical: `${BRAND.siteUrl}/property-for-sale`
  }
};

export default async function Page() {
  const { promoted, regular } = await getPropertiesWithPromotion({
    status: 'For Sale',
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
            "name": "Property for Sale Worldwide",
            "description": "Buy property, land, and commercial real estate with verified listings across global markets.",
            "url": `${BRAND.siteUrl}/property-for-sale`,
            "mainEntity": {
              "@type": "RealEstateAgent",
              "name": BRAND.name,
              "areaServed": "Worldwide",
              "serviceType": "Property Sales and Real Estate Investment"
            }
          })
        }}
      />
      
      <PromotedPropertiesLayout
        promoted={promoted}
        regular={regular}
        totalProperties={promoted.length + regular.length}
        title="Featured Properties for Sale Worldwide"
        description={`Discover ${promoted.length + regular.length} properties for sale across global markets. Browse apartments, houses, land, and commercial real estate with verified listings.`}
        featuredSectionTitle="Featured Properties for Sale"
        regularSectionTitle="Properties for Sale"
        viewAllLink="/search"
        viewAllText="View All Properties for Sale"
      />
    </>
  );
}

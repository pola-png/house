import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Houses for Sale Worldwide | ${BRAND.name}`,
  description: 'Browse standalone houses, townhouses, villas, and luxury homes for sale across global markets.',
  keywords: [
    'houses for sale',
    'standalone houses',
    'buy house',
    'townhouses for sale',
    'villas for sale',
    'luxury houses',
    'family homes for sale',
    'residential houses',
    'buy family home'
  ],
  openGraph: {
    title: `Houses for Sale Worldwide | ${BRAND.name}`,
    description: 'Discover premium standalone houses and villas for sale across global markets.',
    url: `${BRAND.siteUrl}/houses-for-sale`,
    type: 'website'
  },
  alternates: {
    canonical: `${BRAND.siteUrl}/houses-for-sale`
  }
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    propertyType: 'House',
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
            "name": "Houses for Sale Worldwide",
            "description": "Buy standalone houses, townhouses, and villas with verified listings across global markets.",
            "url": `${BRAND.siteUrl}/houses-for-sale`,
            "mainEntity": {
              "@type": "RealEstateAgent",
              "name": BRAND.name,
              "areaServed": "Worldwide",
              "serviceType": "House Sales and Property Investment"
            }
          })
        }}
      />
      
      <PromotedPropertiesLayout
        promoted={promoted}
        regular={regular}
        totalProperties={all.length}
        title="Houses for Sale Worldwide"
        description={`Discover ${all.length}+ houses for sale across global markets. Browse standalone houses, townhouses, villas, and premium family homes.`}
        featuredSectionTitle="Featured Houses for Sale"
        regularSectionTitle="More Houses for Sale"
        viewAllLink="/search"
        viewAllText="View All Houses for Sale"
      />
    </>
  );
}

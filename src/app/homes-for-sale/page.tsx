import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Homes for Sale Worldwide | ${BRAND.name}`,
  description: 'Browse houses, apartments, condos, and luxury homes for sale across global markets.',
  keywords: [
    'homes for sale',
    'houses for sale',
    'buy house',
    'real estate for sale',
    'property for sale',
    'apartments for sale',
    'luxury homes',
    'residential property',
    'buy home'
  ],
  openGraph: {
    title: `Homes for Sale Worldwide | ${BRAND.name}`,
    description: 'Discover premium homes for sale with financing options and verified listings across global markets.',
    url: `${BRAND.siteUrl}/homes-for-sale`,
    type: 'website'
  },
  alternates: {
    canonical: `${BRAND.siteUrl}/homes-for-sale`
  }
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
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
            "name": "Homes for Sale Worldwide",
            "description": "Buy premium homes, apartments, and luxury properties with verified listings across global markets.",
            "url": `${BRAND.siteUrl}/homes-for-sale`,
            "mainEntity": {
              "@type": "RealEstateAgent",
              "name": BRAND.name,
              "areaServed": "Worldwide",
              "serviceType": "Home Sales and Real Estate"
            }
          })
        }}
      />
      
      <PromotedPropertiesLayout
        promoted={promoted}
        regular={regular}
        totalProperties={all.length}
        title="Homes for Sale Worldwide"
        description={`Find ${all.length}+ homes for sale across multiple markets. Browse houses, apartments, condos, and premium properties with verified listings.`}
        featuredSectionTitle="Featured Homes for Sale"
        regularSectionTitle="More Homes for Sale"
        viewAllLink="/search"
        viewAllText="View All Homes for Sale"
      />
    </>
  );
}

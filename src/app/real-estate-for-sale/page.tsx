import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Real Estate for Sale Worldwide | ${BRAND.name}`,
  description: 'Explore residential, commercial, and land opportunities across global property markets with verified listings.',
  keywords: [
    'real estate for sale',
    'investment property',
    'commercial property',
    'residential property',
    'real estate investment',
    'property investment opportunities',
    'buy real estate',
    'global property market',
    'real estate deals'
  ],
  openGraph: {
    title: `Real Estate for Sale Worldwide | ${BRAND.name}`,
    description: 'Discover premium real estate investment opportunities with verified listings across global markets.',
    url: `${BRAND.siteUrl}/real-estate-for-sale`,
    type: 'website'
  },
  alternates: {
    canonical: `${BRAND.siteUrl}/real-estate-for-sale`
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
            "name": "Real Estate for Sale Worldwide",
            "description": "Explore premium real estate opportunities with verified listings across international markets.",
            "url": `${BRAND.siteUrl}/real-estate-for-sale`,
            "mainEntity": {
              "@type": "RealEstateAgent",
              "name": BRAND.name,
              "areaServed": "Worldwide",
              "serviceType": "Real Estate Investment and Property Sales"
            }
          })
        }}
      />
      
      <PromotedPropertiesLayout
        promoted={promoted}
        regular={regular}
        totalProperties={all.length}
        title="Real Estate for Sale Worldwide"
        description={`Explore ${all.length}+ properties for sale across global markets. Browse residential, commercial, and investment opportunities with verified listings.`}
        featuredSectionTitle="Featured Investment Properties"
        regularSectionTitle="More Real Estate Opportunities"
        viewAllLink="/search"
        viewAllText="View All Real Estate Properties"
      />
    </>
  );
}

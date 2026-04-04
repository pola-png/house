import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { BRAND } from '@/lib/brand';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '2 Bedroom Apartments for Rent in Kenya | Houses & Homes',
  description: 'Find 2 bedroom apartments and houses for rent in Kenya. Over 1000+ verified listings in Nairobi, Mombasa, Kisumu. Perfect for families and couples.',
  keywords: [
    '2 bedroom for rent Kenya',
    '2 bedroom apartments Kenya',
    '2 bedroom houses for rent',
    'two bedroom rental Kenya',
    '2BR apartments Nairobi',
    '2 bedroom homes Kenya',
    'family apartments Kenya',
    '2 bedroom flats for rent'
  ],
  openGraph: {
    title: '2 Bedroom Apartments for Rent in Kenya | Best Deals',
    description: 'Discover 2 bedroom properties for rent across Kenya. Verified listings with photos, prices & instant booking.',
    url: `${BRAND.siteUrl}/2-bedroom-rent-in-kenya`,
    type: 'website'
  },
  alternates: {
    canonical: `${BRAND.siteUrl}/2-bedroom-rent-in-kenya`
  }
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    bedrooms: 2,
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
            "name": "2 Bedroom Apartments for Rent in Kenya",
            "description": "Find 2 bedroom apartments and houses for rent across Kenya with verified listings and instant booking.",
            "url": `${BRAND.siteUrl}/2-bedroom-rent-in-kenya`,
            "mainEntity": {
              "@type": "RealEstateAgent",
              "name": "House Rent Kenya",
              "areaServed": "Kenya",
              "serviceType": "2 Bedroom Property Rental"
            }
          })
        }}
      />
      
      <PromotedPropertiesLayout
        promoted={promoted}
        regular={regular}
        totalProperties={all.length}
        title="2 Bedroom Rent in Kenya - Apartments & Houses"
        description={`Discover ${all.length}+ 2 bedroom properties for rent in Kenya. Perfect for small families & couples seeking spacious homes in Nairobi, Mombasa, Kisumu and other major cities.`}
        featuredSectionTitle="Featured 2 Bedroom Properties"
        regularSectionTitle="More 2 Bedroom Properties"
        viewAllLink="/search"
        viewAllText="View All 2 Bedroom Properties"
      />
    </>
  );
}

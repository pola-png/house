import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { BRAND } from '@/lib/brand';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '2 Bedroom Houses for Rent in Mombasa | Coastal Properties Kenya',
  description: 'Find 2 bedroom houses and apartments for rent in Mombasa, Kenya. Beachfront properties in Nyali, Bamburi & Diani. Ocean views from Ksh 40,000/month.',
  keywords: [
    '2 bedroom house rent Mombasa',
    'coastal properties Mombasa',
    'Nyali apartments 2 bedroom',
    'Bamburi houses for rent',
    'Diani beach rentals',
    'beachfront apartments Mombasa',
    '2BR coastal homes Kenya',
    'ocean view properties Mombasa'
  ],
  openGraph: {
    title: '2 Bedroom Coastal Properties in Mombasa | Beach Living',
    description: 'Discover 2 bedroom beachfront properties in Mombasa with ocean views and modern amenities.',
    url: `${BRAND.siteUrl}/2-bedroom-house-for-rent-in-mombasa`,
    type: 'website'
  },
  alternates: {
    canonical: `${BRAND.siteUrl}/2-bedroom-house-for-rent-in-mombasa`,
  },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    location: 'mombasa',
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
            "name": "2 Bedroom Houses for Rent in Mombasa",
            "description": "Find 2 bedroom coastal properties for rent in Mombasa with beachfront views and modern amenities.",
            "url": `${BRAND.siteUrl}/2-bedroom-house-for-rent-in-mombasa`,
            "mainEntity": {
              "@type": "RealEstateAgent",
              "name": "House Rent Kenya",
              "areaServed": "Mombasa, Kenya",
              "serviceType": "2 Bedroom Coastal Property Rental"
            }
          })
        }}
      />
      
      <PromotedPropertiesLayout
        promoted={promoted}
        regular={regular}
        totalProperties={all.length}
        title="2 Bedroom House for Rent in Mombasa"
        description={`Find ${all.length}+ 2 bedroom houses for rent in Mombasa. Coastal living with modern amenities and beachfront access in Nyali, Bamburi & Diani.`}
        featuredSectionTitle="Featured Properties in Mombasa"
        regularSectionTitle="More Properties in Mombasa"
        viewAllLink="/search"
        viewAllText="View All Mombasa Properties"
      />
    </>
  );
}

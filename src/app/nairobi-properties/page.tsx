import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { BRAND } from '@/lib/brand';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Properties for Rent in Nairobi - Apartments, Houses & Homes | House Rent Kenya',
  description: 'Find the best properties for rent in Nairobi, Kenya. Browse verified apartments, houses, studios & luxury homes in Westlands, Kilimani, Karen, Lavington & more. 1000+ listings with instant booking.',
  keywords: [
    'nairobi properties for rent',
    'apartments nairobi',
    'houses for rent nairobi',
    'nairobi rental properties',
    'westlands apartments',
    'kilimani houses',
    'karen homes',
    'lavington properties',
    'nairobi real estate'
  ],
  openGraph: {
    title: 'Properties for Rent in Nairobi - Best Apartments & Houses | House Rent Kenya',
    description: 'Discover premium properties for rent in Nairobi. Verified listings in Westlands, Kilimani, Karen & top neighborhoods. Instant booking, virtual tours.',
    url: `${BRAND.siteUrl}/nairobi-properties`,
    images: ['/nairobi-properties-og.jpg']
  },
  alternates: {
    canonical: `${BRAND.siteUrl}/nairobi-properties`
  }
};

export default async function NairobiPropertiesPage() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    location: 'nairobi',
    status: 'For Rent',
    limit: 20
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="Properties for Rent in Nairobi"
      description={`Find ${all.length}+ properties for rent in Nairobi. Apartments, houses & homes in Westlands, Kilimani, Karen, Lavington & more neighborhoods.`}
      featuredSectionTitle="Featured Properties in Nairobi"
      regularSectionTitle="More Nairobi Properties"
      viewAllLink="/search?q=nairobi&type=rent"
      viewAllText="View All Nairobi Properties"
    />
  );
}

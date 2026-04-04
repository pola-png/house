import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'House Rent in Nairobi - Apartments & Homes for Rent | House Rent Kenya',
  description: 'Find houses for rent in Nairobi, Kenya. Browse 1000+ apartments, bedsitters & homes in Westlands, Kilimani, Karen, Lavington with photos and prices.',
  keywords: 'house rent Nairobi, apartments Nairobi, bedsitter Nairobi, Westlands rent, Kilimani rent, Karen rent, Lavington rent',
  openGraph: {
    title: 'House Rent in Nairobi - Apartments & Homes for Rent',
    description: 'Find houses for rent in Nairobi, Kenya. Browse apartments, bedsitters & homes in prime locations with photos and competitive prices.',
    type: 'website',
  },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    location: 'nairobi',
    propertyType: 'house',
    status: 'For Rent',
    limit: 20
  });
  
  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="House Rent in Nairobi - Apartments & Homes"
      description={`Find ${all.length}+ houses for rent in Nairobi. Westlands, Kilimani, Karen, Lavington & more neighborhoods.`}
      featuredSectionTitle="Featured Properties in Nairobi"
      regularSectionTitle="More Properties in Nairobi"
      viewAllLink="/search"
      viewAllText="View All Nairobi Properties"
    />
  );
}

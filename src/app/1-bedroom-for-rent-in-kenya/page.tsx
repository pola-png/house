import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '1 Bedroom for Rent in Kenya | Affordable Apartments',
  description: 'Find 1 bedroom apartments for rent in Kenya. Affordable rental options for singles & couples across all major cities.',
  keywords: '1 bedroom for rent Kenya, one bedroom rental Kenya, 1BR rent Kenya, affordable apartments Kenya',
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    bedrooms: 1,
    propertyType: 'apartment',
    status: 'For Rent',
    limit: 20
  });
  
  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="1 Bedroom for Rent in Kenya - Affordable Apartments"
      description={`Discover ${all.length}+ 1 bedroom apartments for rent in Kenya. Affordable options for singles & young professionals.`}
      featuredSectionTitle="Featured 1 Bedroom Apartments"
      regularSectionTitle="More 1 Bedroom Apartments"
      viewAllLink="/search"
      viewAllText="View All 1 Bedroom Rentals"
    />
  );
}

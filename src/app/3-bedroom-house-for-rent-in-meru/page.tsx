import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '3 Bedroom House for Rent in Meru | Family Homes Kenya',
  description: 'Find spacious 3 bedroom houses for rent in Meru, Kenya. Family-friendly homes with modern amenities. Browse verified listings with photos and prices.',
  keywords: '3 bedroom house rent Meru, family homes Meru, houses for rent Meru Kenya, 3BR rental Meru',
  openGraph: {
    title: '3 Bedroom House for Rent in Meru | Family Homes Kenya',
    description: 'Find spacious 3 bedroom houses for rent in Meru, Kenya. Family-friendly homes with modern amenities.',
    type: 'website',
  },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    location: 'meru',
    bedrooms: 3,
    status: 'For Rent',
    limit: 20
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="3 Bedroom House for Rent in Meru"
      description={`Find ${all.length}+ spacious 3 bedroom houses for rent in Meru. Family-friendly homes with modern amenities.`}
      featuredSectionTitle="Featured Family Homes in Meru"
      regularSectionTitle="More Properties in Meru"
      viewAllLink="/search"
      viewAllText="View All Meru Properties"
    />
  );
}

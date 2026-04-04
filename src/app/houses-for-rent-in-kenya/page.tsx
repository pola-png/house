import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Houses for Rent in Kenya | Find Your Dream Home',
  description: 'Browse houses for rent across Kenya. Standalone houses, townhouses, villas & mansions available. Verified listings with photos, prices & agent contacts.',
  keywords: 'houses for rent Kenya, standalone houses Kenya, townhouses rent, villas for rent Kenya, mansion rental',
  openGraph: {
    title: 'Houses for Rent in Kenya | Find Your Dream Home',
    description: 'Browse houses for rent across Kenya. Standalone houses, townhouses, villas & mansions available.',
    type: 'website',
  },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    propertyType: 'House',
    status: 'For Rent',
    limit: 20
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="Houses for Rent in Kenya - Find Your Dream Home"
      description={`Browse ${all.length}+ houses for rent across Kenya. Standalone houses, townhouses, villas & mansions available.`}
      featuredSectionTitle="Featured Houses"
      regularSectionTitle="More Houses for Rent"
      viewAllLink="/search"
      viewAllText="View All Houses for Rent"
    />
  );
}

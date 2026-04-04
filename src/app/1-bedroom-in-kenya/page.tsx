import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '1 Bedroom in Kenya | Apartments & Houses',
  description: 'Find 1 bedroom properties in Kenya. Apartments, houses & studios available for rent & sale across all major cities.',
  keywords: '1 bedroom Kenya, one bedroom apartment Kenya, 1BR Kenya, single bedroom Kenya',
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    bedrooms: 1,
    limit: 20
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="1 Bedroom in Kenya - Apartments & Houses"
      description={`Browse ${all.length}+ 1 bedroom properties in Kenya. Perfect for singles, couples & young professionals.`}
      featuredSectionTitle="Featured 1 Bedroom Properties"
      regularSectionTitle="More 1 Bedroom Properties"
      viewAllLink="/1-bedroom-homes"
      viewAllText="View All 1 Bedroom Properties"
    />
  );
}

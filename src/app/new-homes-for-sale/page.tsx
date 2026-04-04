import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'New Homes for Sale in Kenya | Latest Property Listings',
  description: 'Discover new homes for sale in Kenya. Latest property listings, new developments & fresh inventory from trusted developers.',
  keywords: 'new homes for sale Kenya, latest properties Kenya, new developments Kenya, fresh listings',
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    status: 'For Sale',
    limit: 20
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="New Homes for Sale in Kenya - Latest Listings"
      description={`Explore ${all.length}+ new homes for sale in Kenya. Latest property listings & new developments from trusted builders.`}
      featuredSectionTitle="Featured New Homes"
      regularSectionTitle="More New Listings"
      viewAllLink="/search"
      viewAllText="View All New Homes"
    />
  );
}

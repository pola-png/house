import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';

export const revalidate = 3600;

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    status: 'For Rent',
    limit: 20
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="House Rent in Kenya - Find Your Perfect Home"
      description={`Discover ${all.length}+ houses for rent across Kenya. Verified listings in Nairobi, Mombasa, Kisumu & more.`}
      featuredSectionTitle="Featured Properties in Kenya"
      regularSectionTitle="More Properties for Rent"
      viewAllLink="/search"
      viewAllText="View All Houses for Rent"
    />
  );
}

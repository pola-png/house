import type { Metadata } from 'next';

import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { BRAND } from '@/lib/brand';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';

export const metadata: Metadata = {
  title: `Family Homes for Rent | ${BRAND.name}`,
  description: `Browse family houses, villas, and spacious rental homes across global markets.`,
  alternates: { canonical: `${BRAND.siteUrl}/family-homes-for-rent` },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    propertyType: 'House',
    status: 'For Rent',
    limit: 20,
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="Family Homes for Rent"
      description={`Browse ${all.length}+ houses, villas, and larger homes for rent. Compare spacious options designed for families and long-term living.`}
      featuredSectionTitle="Featured Family Homes"
      regularSectionTitle="More Family Rentals"
      viewAllLink="/search"
      viewAllText="View Family Homes"
    />
  );
}

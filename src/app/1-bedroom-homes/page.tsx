import type { Metadata } from 'next';

import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { BRAND } from '@/lib/brand';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';

export const metadata: Metadata = {
  title: `1 Bedroom Homes | ${BRAND.name}`,
  description: `Browse 1 bedroom apartments and homes for rent across global markets.`,
  alternates: { canonical: `${BRAND.siteUrl}/1-bedroom-homes` },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    bedrooms: 1,
    status: 'For Rent',
    limit: 20,
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="1 Bedroom Homes"
      description={`Browse ${all.length}+ one-bedroom rentals and compact homes. Compare layouts, neighborhoods, and pricing in one search experience.`}
      featuredSectionTitle="Featured 1 Bedroom Homes"
      regularSectionTitle="More 1 Bedroom Listings"
      viewAllLink="/search"
      viewAllText="Search 1 Bedroom Homes"
    />
  );
}

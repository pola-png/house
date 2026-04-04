import type { Metadata } from 'next';

import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { BRAND } from '@/lib/brand';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';

export const metadata: Metadata = {
  title: `2 Bedroom Homes | ${BRAND.name}`,
  description: `Browse 2 bedroom apartments and houses for rent across global markets.`,
  alternates: { canonical: `${BRAND.siteUrl}/2-bedroom-homes` },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    bedrooms: 2,
    status: 'For Rent',
    limit: 20,
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="2 Bedroom Homes"
      description={`Browse ${all.length}+ two-bedroom rentals for couples, small families, and shared living. Compare value, size, and location quickly.`}
      featuredSectionTitle="Featured 2 Bedroom Homes"
      regularSectionTitle="More 2 Bedroom Listings"
      viewAllLink="/search"
      viewAllText="Search 2 Bedroom Homes"
    />
  );
}

import type { Metadata } from 'next';

import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { BRAND } from '@/lib/brand';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';

export const metadata: Metadata = {
  title: `3 Bedroom Homes | ${BRAND.name}`,
  description: `Browse 3 bedroom apartments and houses for rent across global markets.`,
  alternates: { canonical: `${BRAND.siteUrl}/3-bedroom-homes` },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    bedrooms: 3,
    status: 'For Rent',
    limit: 20,
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="3 Bedroom Homes"
      description={`Browse ${all.length}+ three-bedroom rentals designed for families, shared living, and larger households.`}
      featuredSectionTitle="Featured 3 Bedroom Homes"
      regularSectionTitle="More 3 Bedroom Listings"
      viewAllLink="/search"
      viewAllText="Search 3 Bedroom Homes"
    />
  );
}

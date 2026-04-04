import type { Metadata } from 'next';

import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { BRAND } from '@/lib/brand';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';

export const metadata: Metadata = {
  title: `Rentals Worldwide | ${BRAND.name}`,
  description: `Search rental properties across cities and countries worldwide with ${BRAND.name}.`,
  alternates: { canonical: `${BRAND.siteUrl}/rentals-worldwide` },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    status: 'For Rent',
    limit: 20,
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="Rentals Worldwide"
      description={`Explore ${all.length}+ rental properties across global markets. Search apartments, houses, and flexible living options with verified listings.`}
      featuredSectionTitle="Featured Global Rentals"
      regularSectionTitle="More Rentals"
      viewAllLink="/search"
      viewAllText="Search Rentals Worldwide"
    />
  );
}

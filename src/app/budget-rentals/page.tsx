import type { Metadata } from 'next';

import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { BRAND } from '@/lib/brand';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';

export const metadata: Metadata = {
  title: `Budget Rentals | ${BRAND.name}`,
  description: `Find compact and budget-friendly rentals, including studios, bedsitters, and affordable apartments.`,
  alternates: { canonical: `${BRAND.siteUrl}/budget-rentals` },
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
      title="Budget Rentals"
      description={`Search ${all.length}+ compact and budget-friendly rental options. Compare efficient spaces for solo renters, students, and first-time movers.`}
      featuredSectionTitle="Featured Budget Rentals"
      regularSectionTitle="More Affordable Listings"
      viewAllLink="/search"
      viewAllText="Search Budget Rentals"
    />
  );
}

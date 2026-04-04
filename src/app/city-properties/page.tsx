import type { Metadata } from 'next';

import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { BRAND } from '@/lib/brand';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';

export const metadata: Metadata = {
  title: `City Properties | ${BRAND.name}`,
  description: `Discover urban apartments, central homes, and prime city property listings around the world.`,
  alternates: { canonical: `${BRAND.siteUrl}/city-properties` },
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
      title="City Properties"
      description={`Discover ${all.length}+ apartments and homes suited for city living. Explore central neighborhoods, business districts, and high-demand urban locations.`}
      featuredSectionTitle="Featured City Listings"
      regularSectionTitle="More City Properties"
      viewAllLink="/search"
      viewAllText="Search City Properties"
    />
  );
}

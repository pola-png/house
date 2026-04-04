import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Bedsitter for Rent in Kasarani - Affordable Studio Apartments | House Rent Kenya',
  description: 'Find affordable bedsitter apartments for rent in Kasarani, Nairobi. Browse verified listings with photos, prices, and agent contacts. Studio apartments from KSh 8,000.',
  keywords: 'bedsitter Kasarani, studio apartment Kasarani, single room Kasarani, affordable rent Kasarani, Nairobi bedsitter',
  openGraph: {
    title: 'Bedsitter for Rent in Kasarani - Affordable Studio Apartments',
    description: 'Find affordable bedsitter apartments for rent in Kasarani, Nairobi. Browse verified listings with photos, prices, and agent contacts.',
    type: 'website',
  },
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    location: 'kasarani',
    propertyType: 'bedsitter',
    maxBedrooms: 1,
    status: 'For Rent',
    limit: 20
  });
  
  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="Bedsitter for Rent in Kasarani - Affordable Studio Apartments"
      description={`Find affordable bedsitter apartments for rent in Kasarani, Nairobi. Browse ${all.length}+ verified listings with photos, prices, and agent contacts.`}
      featuredSectionTitle="Featured Bedsitters in Kasarani"
      regularSectionTitle="More Bedsitters in Kasarani"
      viewAllLink="/search"
      viewAllText="View All Bedsitters in Kasarani"
    />
  );
}

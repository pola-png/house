import { PromotedPropertiesLayout } from '@/components/promoted-properties-layout';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Buy a House in Kenya | Home Purchase Guide',
  description: 'Buy a house in Kenya with confidence. Browse verified properties for sale, get expert advice & connect with trusted real estate agents.',
  keywords: 'buy a house Kenya, home purchase Kenya, buying property Kenya, house buying guide',
};

export default async function Page() {
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    status: 'For Sale',
    propertyType: 'house',
    limit: 20
  });

  return (
    <PromotedPropertiesLayout
      promoted={promoted}
      regular={regular}
      totalProperties={all.length}
      title="Buy a House in Kenya - Your Home Purchase Journey"
      description={`Ready to buy a house in Kenya? Browse ${all.length}+ verified properties for sale with expert guidance & trusted agents.`}
      featuredSectionTitle="Featured Houses for Sale"
      regularSectionTitle="More Houses Available"
      viewAllLink="/search"
      viewAllText="Start Your Home Buying Journey"
    />
  );
}

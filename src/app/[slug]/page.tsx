import { PropertyCard } from '@/components/property-card';
import { getPropertiesWithPromotion } from '@/lib/promoted-properties';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

export const dynamic = 'force-dynamic';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  const locationMatch = slug.match(/(?:house-rent-in-|bedsitter-for-rent-in-|apartments-for-rent-in-)(.+)/);
  if (locationMatch) {
    const searchLocation = locationMatch[1];
    if (locationMap[searchLocation.toLowerCase()]) {
      const displayLocation = locationMap[searchLocation.toLowerCase()];
      
      let title = `House Rent in ${displayLocation} - Find Properties | House Rent Kenya`;
      let description = `Find houses for rent in ${displayLocation}, Kenya. Browse apartments, bedsitters & homes with photos, prices & contact details.`;
      
      if (slug.includes('bedsitter')) {
        title = `Bedsitter for Rent in ${displayLocation} - Affordable Housing | House Rent Kenya`;
        description = `Find affordable bedsitters for rent in ${displayLocation}, Kenya. Studio apartments with photos, prices & landlord contacts.`;
      } else if (slug.includes('apartments')) {
        title = `Apartments for Rent in ${displayLocation} - Modern Living | House Rent Kenya`;
        description = `Find modern apartments for rent in ${displayLocation}, Kenya. 1, 2, 3 bedroom apartments with amenities & competitive prices.`;
      }
      
      return {
        title,
        description,
        keywords: `${displayLocation} rent, houses ${displayLocation}, apartments ${displayLocation}, bedsitter ${displayLocation}, Kenya property, Nairobi ${displayLocation}`,
        openGraph: {
          title,
          description,
          type: 'website',
          siteName: 'House Rent Kenya',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
        },
        alternates: {
          canonical: `${BRAND.siteUrl}/${slug}`,
        },
      };
    }
  }
  
  return {
    title: 'Property Details | House Rent Kenya',
    description: 'View property details, photos, and contact information.',
  };
}

// Location mapping for auto-generated landing pages
const locationMap: Record<string, string> = {
  'muthaiga': 'Muthaiga',
  'westlands': 'Westlands', 
  'kilimani': 'Kilimani',
  'karen': 'Karen',
  'lavington': 'Lavington',
  'kileleshwa': 'Kileleshwa',
  'runda': 'Runda',
  'parklands': 'Parklands',
  'kasarani': 'Kasarani',
  'nairobi': 'Nairobi',
  'kisumu': 'Kisumu',
  'mombasa': 'Mombasa',
  'meru': 'Meru'
};

export default async function SlugPropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Check if it's a location-based landing page first
  const locationMatch = slug.match(/(?:house-rent-in-|bedsitter-for-rent-in-|apartments-for-rent-in-)(.+)/);
  if (locationMatch) {
    const searchLocation = locationMatch[1];
    if (locationMap[searchLocation.toLowerCase()]) {
      return await renderLocationPage(slug, searchLocation);
    }
  }
  
  // Only handle URLs that look like property slugs (contain UUID at end)
  const parts = slug.split('-');
  if (parts.length < 5) return notFound();
  
  const actualId = parts.slice(-5).join('-');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualId)) {
    return notFound();
  }

  redirect(`/property/${slug}`);
}

// Auto-generated location landing page
async function renderLocationPage(slug: string, searchLocation: string) {
  const displayLocation = locationMap[searchLocation.toLowerCase()];
  
  const { promoted, regular, all } = await getPropertiesWithPromotion({
    location: searchLocation.toLowerCase(),
    status: 'For Rent',
    limit: 20
  });
  
  const totalProperties = all.length;
  
  let title = `House Rent in ${displayLocation}`;
  let description = `Find ${totalProperties}+ houses for rent in ${displayLocation}.`;
  
  if (slug.includes('bedsitter')) {
    title = `Bedsitter for Rent in ${displayLocation}`;
    description = `Find ${totalProperties}+ bedsitters for rent in ${displayLocation}.`;
  } else if (slug.includes('apartments')) {
    title = `Apartments for Rent in ${displayLocation}`;
    description = `Find ${totalProperties}+ apartments for rent in ${displayLocation}.`;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{title} - Premium Properties</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {description} Luxury homes, apartments & bedsitters in this prime location.
        {promoted.length > 0 && ` Featuring ${promoted.length} premium listings.`}
      </p>
      
      {/* SEO Content Section */}
      <div className="mb-8 text-sm text-muted-foreground">
        <p>Browse verified properties in {displayLocation} with photos, prices, and direct landlord contacts. 
        Find your perfect home from studio apartments to family houses in one of Kenya's prime locations.</p>
      </div>
      
      {totalProperties > 0 ? (
        <>
          {promoted.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ⭐ Featured Properties in {displayLocation}
                </div>
                <span className="text-sm text-muted-foreground">({promoted.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promoted.map((property) => (
                  <PropertyCard key={`featured-${property.id}`} property={property} />
                ))}
              </div>
            </div>
          )}
          
          {regular.length > 0 && (
            <div className="mb-8">
              {promoted.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-2xl font-semibold">More Properties in {displayLocation}</h3>
                  <span className="text-sm text-muted-foreground">({regular.length})</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regular.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <Button asChild size="lg">
              <Link href="/search">View All {displayLocation} Properties</Link>
            </Button>
          </div>
        </>
      ) : (
        <p className="text-center py-12">
          No properties available in {displayLocation}. <Link href="/search" className="text-primary underline">Browse all properties</Link>
        </p>
      )}
    </div>
  );
}

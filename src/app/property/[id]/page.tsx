import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import PropertyDetailClient from './property-detail-client';
import { PropertySchema } from '@/components/property-schema';
import { toWasabiProxyAbsolute } from '@/lib/wasabi';
import { BRAND } from '@/lib/brand';
import { createPropertyUrl } from '@/lib/utils-seo';

export const revalidate = 3600; // Revalidate every hour for fresh content

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  // Extract actual ID from slug-id format
  let actualId = id;
  if (id.includes('-')) {
    const parts = id.split('-');
    if (parts.length >= 5) {
      actualId = parts.slice(-5).join('-');
    }
  }

  try {
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', actualId)
      .single();

    if (!property) {
      return {
        title: 'Property Not Found | House Rent Kenya',
        description: 'The requested property could not be found on House Rent Kenya.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    // Enhanced SEO title with more keywords
    const statusText = property.status === 'For Rent' ? 'Rent' : property.status === 'For Sale' ? 'Sale' : property.status;
    const priceText = property.status === 'For Rent' ? `/month` : '';
    const title = `${property.bedrooms} Bedroom ${property.propertyType} for ${statusText} in ${property.location}, ${property.city} - Ksh ${property.price.toLocaleString()}${priceText} | House Rent Kenya`;
    
    // Enhanced description with more details
    const amenitiesText = property.amenities && property.amenities.length > 0 
      ? ` Features: ${property.amenities.slice(0, 3).join(', ')}.` 
      : '';
    const description = `${property.bedrooms} bedroom ${property.propertyType.toLowerCase()} for ${statusText.toLowerCase()} in ${property.location}, ${property.city}. Ksh ${property.price.toLocaleString()}${priceText}. ${property.bathrooms} bathrooms, ${property.area} sq ft.${amenitiesText} ${property.description?.substring(0, 100) || 'Premium property with modern amenities'}. Contact verified agent today!`;
    
    const images = Array.isArray(property.images)
      ? property.images
          .map((img: string) => toWasabiProxyAbsolute(img))
          .filter((img: string) => typeof img === 'string' && img.length > 0)
      : [];
    const primaryImage = images[0];
    const ogImages = (primaryImage ? [primaryImage] : images).length
      ? (primaryImage ? [primaryImage] : images)
      : [`${BRAND.siteUrl}/default-property.jpg`];
    const canonicalUrl = createPropertyUrl(property.id, property.title);

    // Comprehensive keywords for better SEO
    const keywords = [
      // Primary keywords
      `${property.bedrooms} bedroom ${property.propertyType.toLowerCase()} ${property.location.toLowerCase()}`,
      `${property.propertyType.toLowerCase()} for ${statusText.toLowerCase()} ${property.location.toLowerCase()}`,
      `${property.bedrooms}BR ${property.location.toLowerCase()} ${property.city.toLowerCase()}`,
      
      // Location-based keywords
      `${property.location.toLowerCase()} ${property.propertyType.toLowerCase()}`,
      `${property.city.toLowerCase()} ${property.propertyType.toLowerCase()}`,
      `property for ${statusText.toLowerCase()} ${property.location.toLowerCase()}`,
      `house rent ${property.location.toLowerCase()}`,
      `apartments ${property.location.toLowerCase()}`,
      
      // Price-based keywords
      `${property.propertyType.toLowerCase()} under ${Math.ceil(property.price / 10000) * 10000}`,
      `affordable ${property.propertyType.toLowerCase()} ${property.city.toLowerCase()}`,
      
      // Feature-based keywords
      `${property.bedrooms} bed ${property.bathrooms} bath ${property.location.toLowerCase()}`,
      `${property.area} sq ft ${property.propertyType.toLowerCase()}`,
      
      // General keywords
      'kenya property rental',
      'verified property listings kenya',
      'house rent kenya',
      `${property.city.toLowerCase()} real estate`,
      'property with photos kenya'
    ];

    // Add amenity-based keywords
    if (property.amenities && property.amenities.length > 0) {
      property.amenities.forEach((amenity: string) => {
        keywords.push(`${property.propertyType.toLowerCase()} with ${amenity.toLowerCase()} ${property.location.toLowerCase()}`);
      });
    }

      return {
        title,
        description,
        keywords,
        openGraph: {
          title,
          description,
          images: ogImages,
          url: canonicalUrl,
          type: 'article',
          siteName: BRAND.name,
          locale: 'en_KE'
        },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImages,
        site: '@HouseRentKenya'
      },
      alternates: {
        canonical: canonicalUrl
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      other: {
        'geo.region': 'KE',
        'geo.placename': `${property.location}, ${property.city}`,
        ...(property.latitude && property.longitude && {
          'geo.position': `${property.latitude};${property.longitude}`,
          'ICBM': `${property.latitude}, ${property.longitude}`
        })
      }
    };
  } catch (error) {
    return {
      title: 'Property | House Rent Kenya',
      description: 'Find your perfect property on Kenya\'s leading rental platform.'
    };
  }
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  
  // Extract actual ID from slug-id format
  let actualId = id;
  if (id.includes('-')) {
    const parts = id.split('-');
    if (parts.length >= 5) {
      actualId = parts.slice(-5).join('-');
    }
  }

  // Fetch property for schema
  let property = null;
  let agent = null;
  try {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('id', actualId)
      .single();
    property = data;
    
    // Fetch agent data for enhanced schema
    if (property?.landlordId) {
      const { data: agentData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', property.landlordId)
        .single();
      agent = agentData;
    }
  } catch (error) {
    console.error('Error fetching property for schema:', error);
  }

  const propertyWithAgent = property ? { ...property, agent: agent || property.agent } : null;
  const canonicalUrl = property ? createPropertyUrl(property.id, property.title) : `${BRAND.siteUrl}/property/${actualId}`;
  
  return (
    <>
      {/* Enhanced JSON-LD Schema for SEO */}
      {property && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateListing",
              "@id": canonicalUrl,
              "url": canonicalUrl,
              "name": property.title,
              "description": property.description,
              "datePosted": property.createdAt,
              "validThrough": property.featuredExpiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              "price": {
                "@type": "PriceSpecification",
                "price": property.price,
                "priceCurrency": "KES",
                "priceType": property.status === 'For Rent' ? 'monthly' : 'total'
              },
              "availableAtOrFrom": {
                "@type": "Place",
                "name": `${property.location}, ${property.city}`,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": property.location,
                  "addressRegion": property.city,
                  "addressCountry": "Kenya"
                },
                "geo": property.latitude && property.longitude ? {
                  "@type": "GeoCoordinates",
                  "latitude": property.latitude,
                  "longitude": property.longitude
                } : undefined
              },
              "category": property.propertyType,
              "numberOfRooms": property.bedrooms,
              "numberOfBathroomsTotal": property.bathrooms,
              "floorSize": {
                "@type": "QuantitativeValue",
                "value": property.area,
                "unitCode": "FTK"
              },
              "amenityFeature": property.amenities?.map((amenity: string) => ({
                "@type": "LocationFeatureSpecification",
                "name": amenity
              })) || [],
              "image": property.images?.map((img: string) => toWasabiProxyAbsolute(img)).filter(Boolean) || [],
              "provider": {
                "@type": "RealEstateAgent",
                "name": agent?.displayName || agent?.firstName + ' ' + agent?.lastName || BRAND.name,
                "telephone": agent?.phoneNumber,
                "email": agent?.email,
                "url": BRAND.siteUrl
              },
              "mainEntity": {
                "@type": "Residence",
                "name": property.title,
                "numberOfRooms": property.bedrooms,
                "accommodationCategory": property.propertyType
              },
              "offers": {
                "@type": "Offer",
                "price": property.price,
                "priceCurrency": "KES",
                "availability": "https://schema.org/InStock",
                "validFrom": property.createdAt,
                "priceValidUntil": property.featuredExpiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
              },
              "potentialAction": {
                "@type": "ViewAction",
                "target": canonicalUrl
              }
            })
          }}
        />
      )}
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": BRAND.siteUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Properties",
                "item": `${BRAND.siteUrl}/search`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": property?.location || "Property",
                "item": `${BRAND.siteUrl}/search?q=${property?.location || ''}`
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": property?.title || "Property Details",
                "item": canonicalUrl
              }
            ]
          })
        }}
      />
      
      {propertyWithAgent && <PropertySchema property={propertyWithAgent} />}
      <PropertyDetailClient
        id={actualId}
        initialProperty={propertyWithAgent}
      />
    </>
  );
}

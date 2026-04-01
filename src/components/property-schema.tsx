import { Property } from '@/lib/types';
import { BRAND } from '@/lib/brand';
import { toWasabiProxyAbsolute } from '@/lib/wasabi';

interface PropertySchemaProps {
  property: Property;
}

export function PropertySchema({ property }: PropertySchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description,
    "url": `${BRAND.siteUrl}/property/${property.id}`,
    "image": property.images?.[0]
      ? toWasabiProxyAbsolute(property.images[0])
      : `${BRAND.siteUrl}/default-property.jpg`,
    "datePosted": property.createdAt,
    "validThrough": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "KES",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      "seller": {
        "@type": "Person",
        "name": property.agent?.displayName || "Property Agent",
        "telephone": BRAND.phone
      }
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.location,
      "addressRegion": property.city,
      "addressCountry": "KE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": property.latitude || -1.286389,
      "longitude": property.longitude || 36.817223
    },
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": property.area,
      "unitCode": "SQM"
    },
    "numberOfRooms": property.bedrooms,
    "numberOfBathroomsTotal": property.bathrooms,
    "accommodationCategory": property.propertyType,
    "amenityFeature": property.amenities?.map(amenity => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity
    })) || [],
    "landlord": {
      "@type": "RealEstateAgent",
      "name": property.agent?.displayName || `${BRAND.name} Agent`,
      "telephone": BRAND.phone,
      "email": BRAND.email
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

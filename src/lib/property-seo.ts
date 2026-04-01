import type { Property } from '@/lib/types';
import { BRAND } from '@/lib/brand';

/**
 * Generate SEO-friendly URL slug for a property
 */
export function generatePropertySlug(property: Property): string {
  const {
    title,
    bedrooms,
    propertyType,
    location,
    city,
    status,
    price,
    id
  } = property;

  // Clean and format components
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();

  const cleanLocation = location
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

  const cleanCity = city
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

  const statusText = status === 'For Rent' ? 'rent' : status === 'For Sale' ? 'sale' : 'available';
  const priceK = Math.round(price / 1000);

  // Generate SEO-optimized slug
  const slug = `${bedrooms}-bedroom-${propertyType.toLowerCase()}-for-${statusText}-in-${cleanLocation}-${cleanCity}-ksh-${priceK}k-${id}`;

  return slug
    .replace(/[^a-z0-9-]/g, '') // Ensure only valid URL characters
    .replace(/-+/g, '-') // Clean up multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate comprehensive SEO keywords for a property
 */
export function generatePropertyKeywords(property: Property): string[] {
  const {
    bedrooms,
    bathrooms,
    propertyType,
    location,
    city,
    status,
    price,
    area,
    amenities
  } = property;

  const statusText = status === 'For Rent' ? 'rent' : status === 'For Sale' ? 'sale' : 'available';
  const priceRange = Math.ceil(price / 50000) * 50000; // Round to nearest 50k

  const keywords = [
    // Primary location + property type combinations
    `${bedrooms} bedroom ${propertyType.toLowerCase()} ${location.toLowerCase()}`,
    `${propertyType.toLowerCase()} for ${statusText} ${location.toLowerCase()}`,
    `${bedrooms}BR ${location.toLowerCase()} ${city.toLowerCase()}`,
    
    // Detailed property descriptions
    `${bedrooms} bed ${bathrooms} bath ${location.toLowerCase()}`,
    `${area} sq ft ${propertyType.toLowerCase()} ${location.toLowerCase()}`,
    
    // Price-based keywords
    `${propertyType.toLowerCase()} under ${priceRange}`,
    `affordable ${propertyType.toLowerCase()} ${city.toLowerCase()}`,
    `${propertyType.toLowerCase()} ksh ${Math.round(price / 1000)}k`,
    
    // Location variations
    `property for ${statusText} ${location.toLowerCase()}`,
    `house rent ${location.toLowerCase()}`,
    `apartments ${location.toLowerCase()}`,
    `${city.toLowerCase()} ${propertyType.toLowerCase()}`,
    
    // Bedroom-specific searches
    `${bedrooms} bedroom for ${statusText} ${city.toLowerCase()}`,
    `${bedrooms}BR ${city.toLowerCase()}`,
    
    // General Kenya searches
    `${propertyType.toLowerCase()} for ${statusText} kenya`,
    `${bedrooms} bedroom kenya`,
    `property rental ${city.toLowerCase()}`,
    
    // Quality indicators
    `verified ${propertyType.toLowerCase()} ${location.toLowerCase()}`,
    `modern ${propertyType.toLowerCase()} ${city.toLowerCase()}`,
    `quality housing ${location.toLowerCase()}`,
  ];

  // Add amenity-based keywords
  if (amenities && amenities.length > 0) {
    amenities.forEach((amenity: string) => {
      keywords.push(`${propertyType.toLowerCase()} with ${amenity.toLowerCase()} ${location.toLowerCase()}`);
      keywords.push(`${amenity.toLowerCase()} ${city.toLowerCase()}`);
    });
  }

  // Add neighborhood-specific keywords for major cities
  if (city.toLowerCase().includes('nairobi')) {
    keywords.push(
      `nairobi ${propertyType.toLowerCase()}`,
      `${location.toLowerCase()} nairobi`,
      `nairobi rental properties`,
      `apartments nairobi`
    );
  }

  if (city.toLowerCase().includes('mombasa')) {
    keywords.push(
      `mombasa ${propertyType.toLowerCase()}`,
      `coastal properties mombasa`,
      `beachfront ${propertyType.toLowerCase()}`,
      `mombasa rental`
    );
  }

  if (city.toLowerCase().includes('kisumu')) {
    keywords.push(
      `kisumu ${propertyType.toLowerCase()}`,
      `lakeside properties kisumu`,
      `kisumu rental properties`
    );
  }

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Generate SEO-optimized meta description for a property
 */
export function generatePropertyDescription(property: Property): string {
  const {
    bedrooms,
    bathrooms,
    propertyType,
    location,
    city,
    status,
    price,
    area,
    amenities,
    description
  } = property;

  const statusText = status === 'For Rent' ? 'rent' : status === 'For Sale' ? 'sale' : 'available';
  const priceText = status === 'For Rent' ? '/month' : '';
  
  // Top amenities to highlight
  const topAmenities = amenities && amenities.length > 0 
    ? amenities.slice(0, 3).join(', ')
    : 'modern amenities';

  const baseDescription = `${bedrooms} bedroom ${propertyType.toLowerCase()} for ${statusText} in ${location}, ${city}. Ksh ${price.toLocaleString()}${priceText}. ${bathrooms} bathrooms, ${area} sq ft. Features: ${topAmenities}.`;
  
  // Add custom description if available
  const customPart = description 
    ? ` ${description.substring(0, 80)}...` 
    : ' Premium property with verified listing.';
    
  const cta = ' Contact verified agent today for viewing!';
  
  const fullDescription = baseDescription + customPart + cta;
  
  // Ensure description is within optimal length (150-160 characters)
  return fullDescription.length > 160 
    ? fullDescription.substring(0, 157) + '...'
    : fullDescription;
}

/**
 * Generate property-specific schema.org data
 */
export function generatePropertySchema(property: Property, agent?: any) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description,
    "url": `${BRAND.siteUrl}/property/${property.id}`,
    "datePosted": property.createdAt,
    "price": {
      "@type": "PriceSpecification",
      "price": property.price,
      "priceCurrency": "KES"
    },
    "availableAtOrFrom": {
      "@type": "Place",
      "name": `${property.location}, ${property.city}`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": property.location,
        "addressRegion": property.city,
        "addressCountry": "Kenya"
      }
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
    "image": property.images || [],
    "provider": {
      "@type": "RealEstateAgent",
      "name": agent?.displayName || BRAND.name,
      "telephone": agent?.phoneNumber,
      "email": agent?.email,
      "url": BRAND.siteUrl
    }
  };
}

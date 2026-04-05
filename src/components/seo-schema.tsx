"use client";

import { useEffect } from 'react';
import { BRAND } from '@/lib/brand';
import { createAbsolutePropertyUrl } from '@/lib/utils-seo';

interface SEOSchemaProps {
  type: 'property' | 'search' | 'homepage' | 'organization';
  data?: any;
}

export function SEOSchema({ type, data }: SEOSchemaProps) {
  useEffect(() => {
    let schema = {};

    switch (type) {
      case 'homepage':
        schema = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": BRAND.name,
          "alternateName": BRAND.shortName,
          "url": BRAND.siteUrl,
          "description": `${BRAND.name} helps users find homes to rent or buy.`,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${BRAND.siteUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          },
          "publisher": {
            "@type": "Organization",
            "name": BRAND.name,
            "logo": {
              "@type": "ImageObject",
              "url": `${BRAND.siteUrl}${BRAND.logoPath}`
            }
          }
        };
        break;

      case 'property':
        if (data) {
          schema = {
            "@context": "https://schema.org",
            "@type": "Accommodation",
            "name": data.title,
            "description": data.description,
            "url": createAbsolutePropertyUrl(data.id, data.title),
            "image": data.images?.[0] || `${BRAND.siteUrl}/default-property.jpg`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": data.location,
              "addressRegion": data.city,
              "addressCountry": "KE"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": data.latitude || -1.286389,
              "longitude": data.longitude || 36.817223
            },
            "priceRange": `KSh ${data.price}`,
            "priceCurrency": "KES",
            "numberOfRooms": data.bedrooms,
            "floorSize": {
              "@type": "QuantitativeValue",
              "value": data.area,
              "unitCode": "FTK"
            },
            "amenityFeature": data.amenities?.map((amenity: string) => ({
              "@type": "LocationFeatureSpecification",
              "name": amenity
            })) || [],
            "landlord": {
              "@type": "Person",
              "name": data.agent?.displayName || "Property Agent"
            },
            "datePosted": data.createdAt,
            "availabilityStarts": data.createdAt
          };
        }
        break;

      case 'search':
        schema = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `Property Search Results - ${BRAND.name}`,
          "description": "Search results for rental and sale properties across global markets",
          "url": `${BRAND.siteUrl}/search`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": data?.totalResults || 0,
              "itemListElement": data?.properties?.map((property: any, index: number) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Accommodation",
                  "name": property.title,
                  "url": createAbsolutePropertyUrl(property.id, property.title)
                }
              })) || []
            }
          };
        break;

      case 'organization':
        schema = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": BRAND.name,
          "alternateName": BRAND.shortName,
          "url": BRAND.siteUrl,
          "logo": `${BRAND.siteUrl}${BRAND.logoPath}`,
          "description": `${BRAND.name} helps people find homes to rent or buy.`,
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": BRAND.phone,
            "contactType": "customer service",
            "areaServed": "Worldwide",
            "availableLanguage": ["English"]
          },
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "Worldwide"
          }
        };
        break;
    }

    // Remove existing schema
    const existingScript = document.querySelector('script[data-schema-type]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-type', type);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector(`script[data-schema-type="${type}"]`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
}

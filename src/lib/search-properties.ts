import { supabase } from '@/lib/supabase';
import { normalizeWasabiImageArray } from '@/lib/wasabi';

export interface SearchPropertyFilters {
  q?: string;
  type?: string;
  propertyTypes?: string[];
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  baths?: string;
  amenities?: string[];
}

export interface SearchPropertyResult {
  pageTitle: string;
  properties: any[];
  promotedProperties: any[];
  regularProperties: any[];
}

async function fetchAllProperties(query: any) {
  const batchSize = 1000;
  const allRows: any[] = [];
  let from = 0;

  while (true) {
    const to = from + batchSize - 1;
    const { data, error } = await query.range(from, to);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    allRows.push(...data);

    if (data.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  return allRows;
}

export async function fetchSearchProperties(filters: SearchPropertyFilters): Promise<SearchPropertyResult> {
  const q = filters.q?.toLowerCase();
  const listingType = filters.type;
  const propertyTypes = filters.propertyTypes ?? [];
  const minPrice = filters.minPrice;
  const maxPrice = filters.maxPrice;
  const beds = filters.beds;
  const baths = filters.baths;
  const amenities = filters.amenities ?? [];

  let pageTitle = 'Properties';
  let query = supabase.from('properties').select('*');
  const relevanceFilters: string[] = [];

  if (listingType === 'rent') {
    query = query.in('status', ['Available', 'For Rent']);
    pageTitle = 'Properties for Rent';
  } else if (listingType === 'buy' || listingType === 'sale') {
    query = query.eq('status', 'For Sale');
    pageTitle = 'Properties for Sale';
  } else if (listingType === 'short-let') {
    query = query.eq('status', 'Short Let');
    pageTitle = 'Short Let Properties';
  } else if (listingType === 'land') {
    query = query.eq('propertyType', 'Land');
    pageTitle = 'Land for Sale';
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,city.ilike.%${q}%,propertyType.ilike.%${q}%,description.ilike.%${q}%`);
    relevanceFilters.push(q);
  }

  const uniquePropertyTypes = [...new Set(propertyTypes)].filter(Boolean);
  if (uniquePropertyTypes.length > 0) {
    const typeConditions = uniquePropertyTypes.map((type) => `propertyType.ilike.%${type}%,title.ilike.%${type}%`);
    if (typeConditions.length === 1) {
      query = query.or(`propertyType.ilike.%${uniquePropertyTypes[0]}%,title.ilike.%${uniquePropertyTypes[0]}%`);
    } else {
      query = query.or(typeConditions.join(','));
    }
    relevanceFilters.push(...uniquePropertyTypes);
  }

  if (baths) {
    query = query.gte('bathrooms', parseInt(baths, 10));
  }

  if (amenities.length > 0) {
    amenities.forEach((amenity) => {
      query = query.contains('amenities', [amenity]);
    });
  }

  if (minPrice) {
    query = query.gte('price', parseInt(minPrice, 10));
  }
  if (maxPrice) {
    query = query.lte('price', parseInt(maxPrice, 10));
  }

  if (beds) {
    const bedroomCount = beds === '4+' ? 4 : parseInt(beds, 10);
    query = query.gte('bedrooms', bedroomCount);
  }

  const data = await fetchAllProperties(query.order('createdAt', { ascending: false }));

  let promotedQuery = supabase
    .from('properties')
    .select('*')
    .or('isPremium.eq.true,featuredExpiresAt.gt.' + new Date().toISOString());

  if (listingType === 'rent') {
    promotedQuery = promotedQuery.in('status', ['Available', 'For Rent']);
  } else if (listingType === 'buy' || listingType === 'sale') {
    promotedQuery = promotedQuery.eq('status', 'For Sale');
  } else if (listingType === 'short-let') {
    promotedQuery = promotedQuery.eq('status', 'Short Let');
  } else if (listingType === 'land') {
    promotedQuery = promotedQuery.eq('propertyType', 'Land');
  }

  if (q) {
    promotedQuery = promotedQuery.or(`title.ilike.%${q}%,location.ilike.%${q}%,city.ilike.%${q}%,propertyType.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data: allPromotedData } = await promotedQuery.order('createdAt', { ascending: false });
  const promotedProperties = allPromotedData || [];

  const propertyMap = new Map();
  promotedProperties.forEach((property) => {
    propertyMap.set(property.id, { ...property, isPromoted: true });
  });
  (data || []).forEach((property) => {
    if (!propertyMap.has(property.id)) {
      propertyMap.set(property.id, { ...property, isPromoted: false });
    }
  });

  const combinedData = Array.from(propertyMap.values());
  const scoredProperties = combinedData.map((property: any) => {
    let score = 0;
    const title = property.title?.toLowerCase() || '';
    const location = property.location?.toLowerCase() || '';
    const city = property.city?.toLowerCase() || '';
    const description = property.description?.toLowerCase() || '';

    relevanceFilters.forEach((filter) => {
      const searchTerm = filter.toLowerCase();
      if (title.includes(searchTerm)) score += 15;
      if (location.includes(searchTerm)) score += 10;
      if (city.includes(searchTerm)) score += 8;
      if (property.propertyType?.toLowerCase().includes(searchTerm)) score += 10;
      if (description.includes(searchTerm)) score += 2;
    });

    return { ...property, relevanceScore: score };
  });

  scoredProperties.sort((a: any, b: any) => {
    if (a.isPromoted !== b.isPromoted) return b.isPromoted ? 1 : -1;
    if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const landlordIds = [...new Set(scoredProperties.map((property: any) => property.landlordId).filter(Boolean))];
  const { data: profiles } = landlordIds.length
    ? await supabase.from('profiles').select('*').in('id', landlordIds)
    : { data: [] as any[] };
  const profileMap = new Map(profiles?.map((profile: any) => [profile.id, profile]) || []);

  const propertiesWithAgents = scoredProperties.map((property: any) => {
    const profileData = profileMap.get(property.landlordId);
    return {
      ...property,
      images: normalizeWasabiImageArray(property.images),
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      agent: profileData
        ? {
            uid: profileData.id,
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            displayName: profileData.displayName || profileData.email?.split('@')[0] || '',
            email: profileData.email || '',
            role: profileData.role || 'agent',
            agencyName: profileData.agencyName,
            phoneNumber: profileData.phoneNumber,
            photoURL: profileData.photoURL,
            createdAt: profileData.createdAt,
          }
        : {
            uid: 'default-agent',
            firstName: 'Default',
            lastName: 'Agent',
            displayName: 'Default Agent',
            email: 'agent@default.com',
            role: 'agent',
            agencyName: 'Default Agency',
            createdAt: new Date().toISOString(),
          },
    };
  });

  const currentDate = new Date();
  const promoted = propertiesWithAgents.filter((property: any) =>
    property.isPremium || (property.featuredExpiresAt && new Date(property.featuredExpiresAt) > currentDate)
  );
  const regular = propertiesWithAgents.filter((property: any) =>
    !property.isPremium && (!property.featuredExpiresAt || new Date(property.featuredExpiresAt) <= currentDate)
  );

  return {
    pageTitle,
    properties: propertiesWithAgents,
    promotedProperties: promoted,
    regularProperties: regular,
  };
}

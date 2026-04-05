"use client";

import { PropertyCard } from "@/components/property-card";
import { SearchFilters } from "@/components/search-filters";
import { AdvancedSearch } from "@/components/advanced-search";
import { PropertyComparison } from "@/components/property-comparison";
import { AIRecommendations } from "@/components/ai-recommendations";
import { MarketAnalytics } from "@/components/market-analytics";
import { SEOSchema } from "@/components/seo-schema";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Filter, BarChart3, Sparkles, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Property } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { normalizeWasabiImageArray } from "@/lib/wasabi";

function SearchContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [promotedProperties, setPromotedProperties] = useState<Property[]>([]);
  const [regularProperties, setRegularProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("Properties");
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchController, setFetchController] = useState<AbortController | null>(null);
  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(properties.length / itemsPerPage));

  // Listen for force clear events
  useEffect(() => {
    const handleClearSearch = () => {
      setProperties([]);
      setPromotedProperties([]);
      setRegularProperties([]);
      setIsLoading(true);
    };
    
    // Listen for page load completion
    const handlePageLoad = () => {
      console.log('Page load detected, isLoading:', isLoading, 'properties:', properties.length);
      if (isLoading && properties.length === 0 && !fetchController) {
        console.log('Page loaded but no results, retrying fetch...');
        const controller = new AbortController();
        setFetchController(controller);
        setTimeout(() => fetchProperties(controller), 500);
      }
    };
    
    // Listen for navigation completion
    const handleRouteChange = () => {
      console.log('Route change detected, readyState:', document.readyState);
      if (document.readyState === 'complete') {
        handlePageLoad();
      }
    };
    
    // Listen for popstate (back/forward navigation)
    const handlePopState = () => {
      console.log('Popstate detected, forcing search update');
      setProperties([]);
      setPromotedProperties([]);
      setRegularProperties([]);
      setIsLoading(true);
      setTimeout(() => fetchProperties(), 100);
    };
    
    window.addEventListener('clearSearch', handleClearSearch);
    window.addEventListener('load', handlePageLoad);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('readystatechange', handleRouteChange);
    
    return () => {
      window.removeEventListener('clearSearch', handleClearSearch);
      window.removeEventListener('load', handlePageLoad);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('readystatechange', handleRouteChange);
    };
  }, [isLoading, properties.length]);

  useEffect(() => {
    console.log('URL changed, searchParams:', searchParams?.toString());
    
    // Cancel previous request if it exists
    if (fetchController) {
      console.log('Cancelling previous request');
      fetchController.abort();
    }
    
    // Clear previous results and show loading immediately
    setProperties([]);
    setPromotedProperties([]);
    setRegularProperties([]);
    setIsLoading(true);
    setCurrentPage(1);
    
    // Create new controller for this request
    const controller = new AbortController();
    setFetchController(controller);
    
    // Force immediate fetch
    fetchProperties(controller);
    
    return () => {
      controller.abort();
    };
  }, [searchParams?.toString()]);

  const fetchAllProperties = async (query: any) => {
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
  };

  const fetchProperties = async (controller?: AbortController) => {
    console.log('Starting fetchProperties...');
    
    // Prevent multiple simultaneous requests
    if (isLoading && !controller) {
      console.log('Request already in progress, skipping');
      return;
    }
    
    try {
      const q = searchParams?.get('q')?.toLowerCase();
      console.log('Search query:', q);
      
      const listingType = searchParams?.get('type');
      const propertyTypes = searchParams?.getAll('property_type') ?? [];
      const homePropertyType = searchParams?.get('property_type');
      const allPropertyTypes = [...propertyTypes];
      if (homePropertyType) allPropertyTypes.push(homePropertyType);
      const minPrice = searchParams?.get('min_price');
      const maxPrice = searchParams?.get('max_price');
      const beds = searchParams?.get('beds');
      const baths = searchParams?.get('baths');
      const amenities = searchParams?.getAll('amenities') ?? [];

      // Enhanced filtering with relevance scoring
      let query = supabase.from('properties').select('*');
      let relevanceFilters = [];

      if (listingType === 'rent') {
        query = query.in('status', ['Available', 'For Rent']);
        setPageTitle("Properties for Rent");
      } else if (listingType === 'buy' || listingType === 'sale') {
        query = query.eq('status', 'For Sale');
        setPageTitle("Properties for Sale");
      } else if (listingType === 'short-let') {
        query = query.eq('status', 'Short Let');
        setPageTitle("Short Let Properties");
      } else if (listingType === 'land') {
        query = query.eq('propertyType', 'Land');
        setPageTitle("Land for Sale");
      }

      if (q) {
        // Enhanced search with title priority
        query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,city.ilike.%${q}%,propertyType.ilike.%${q}%,description.ilike.%${q}%`);
        relevanceFilters.push(q);
      }

      const uniquePropertyTypes = [...new Set(allPropertyTypes)].filter(Boolean);
      if (uniquePropertyTypes.length > 0) {
        const typeConditions = uniquePropertyTypes.map(type => `propertyType.ilike.%${type}%,title.ilike.%${type}%`);
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
        amenities.forEach(amenity => {
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

      console.log('Executing query...');
      const data = await fetchAllProperties(query.order('createdAt', { ascending: false }));

      console.log('Query results:', data?.length || 0, 'properties');

      // Get promoted properties with same filters as regular properties
      let promotedQuery = supabase
        .from('properties')
        .select('*')
        .or('isPremium.eq.true,featuredExpiresAt.gt.' + new Date().toISOString());

      // Apply same listing type filter to promoted properties
      if (listingType === 'rent') {
        promotedQuery = promotedQuery.in('status', ['Available', 'For Rent']);
      } else if (listingType === 'buy' || listingType === 'sale') {
        promotedQuery = promotedQuery.eq('status', 'For Sale');
      } else if (listingType === 'short-let') {
        promotedQuery = promotedQuery.eq('status', 'Short Let');
      } else if (listingType === 'land') {
        promotedQuery = promotedQuery.eq('propertyType', 'Land');
      }

      // Apply location filter to promoted properties if user searched for location
      if (q) {
        promotedQuery = promotedQuery.or(`title.ilike.%${q}%,location.ilike.%${q}%,city.ilike.%${q}%,propertyType.ilike.%${q}%,description.ilike.%${q}%`);
      }

      const { data: allPromotedData, error: promotedError } = await promotedQuery
        .order('createdAt', { ascending: false });

      if (promotedError) {
        console.error('Promoted properties error:', promotedError);
      }

      // Combine and score properties for relevance
      const allProperties = [...(data || [])];
      const promotedProperties = allPromotedData || [];
      
      // Remove duplicates and merge - promoted properties always included
      const propertyMap = new Map();
      
      // Add ALL promoted properties first (they always show)
      promotedProperties.forEach(p => {
        propertyMap.set(p.id, { ...p, isPromoted: true });
      });
      
      // Add regular properties that match search criteria
      allProperties.forEach(p => {
        if (!propertyMap.has(p.id)) {
          propertyMap.set(p.id, { ...p, isPromoted: false });
        }
      });
      
      const combinedData = Array.from(propertyMap.values());
      
      // Score properties for relevance
      const scoredProperties = combinedData.map(p => {
        let score = 0;
        const title = p.title?.toLowerCase() || '';
        const location = p.location?.toLowerCase() || '';
        const city = p.city?.toLowerCase() || '';
        const description = p.description?.toLowerCase() || '';
        
        relevanceFilters.forEach(filter => {
          const searchTerm = filter.toLowerCase();
          if (title.includes(searchTerm)) score += 15; // Title matches get highest priority
          if (location.includes(searchTerm)) score += 10;
          if (city.includes(searchTerm)) score += 8;
          if (p.propertyType?.toLowerCase().includes(searchTerm)) score += 10;
          if (description.includes(searchTerm)) score += 2;
        });
        
        return { ...p, relevanceScore: score };
      });
      
      // Sort by promotion status first, then relevance, then date
      scoredProperties.sort((a, b) => {
        if (a.isPromoted !== b.isPromoted) return b.isPromoted ? 1 : -1;
        if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const landlordIds = [...new Set(scoredProperties.map(p => p.landlordId))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', landlordIds);
      
      if (profilesError) {
        console.error('Profiles error:', profilesError);
      }
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const propertiesWithAgents = scoredProperties.map(p => {
        const profileData = profileMap.get(p.landlordId);
        return {
          ...p,
          images: normalizeWasabiImageArray(p.images),
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          agent: profileData ? {
            uid: profileData.id,
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            displayName: profileData.displayName || profileData.email?.split('@')[0] || '',
            email: profileData.email || '',
            role: profileData.role || 'agent',
            agencyName: profileData.agencyName,
            phoneNumber: profileData.phoneNumber,
            photoURL: profileData.photoURL,
            createdAt: new Date(profileData.createdAt)
          } : {
            uid: 'default-agent',
            firstName: 'Default',
            lastName: 'Agent',
            displayName: 'Default Agent',
            email: 'agent@default.com',
            role: 'agent',
            agencyName: 'Default Agency',
            createdAt: new Date()
          }
        };
      });

      // Separate promoted and regular properties based on current promotion status
      const currentDate = new Date();
      const promoted = propertiesWithAgents.filter(p => 
        p.isPremium || 
        (p.featuredExpiresAt && new Date(p.featuredExpiresAt) > currentDate)
      );
      const regular = propertiesWithAgents.filter(p => 
        !p.isPremium && 
        (!p.featuredExpiresAt || new Date(p.featuredExpiresAt) <= currentDate)
      );

      // Properties are already sorted by relevance and promotion status
      console.log('Setting properties:', promoted.length + regular.length, 'total');
      
      // Check if request was cancelled
      if (controller?.signal.aborted) {
        console.log('Request was cancelled, not updating state');
        return;
      }
      
      setPromotedProperties(promoted);
      setRegularProperties(regular);
      setProperties(propertiesWithAgents); // Use all properties in sorted order
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      console.error('Error fetching properties:', error);
      setProperties([]);
      setPromotedProperties([]);
      setRegularProperties([]);
    } finally {
      if (!controller?.signal.aborted) {
        console.log('Fetch completed, setting loading to false');
        setIsLoading(false);
        setFetchController(null);
      }
    }
  };

  // Ensure the current page never exceeds the available pages when the result count changes
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [properties.length]);

  const getVisiblePages = () => {
    const windowSize = 5;
    const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
    const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
    return Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);
  };

  return (
    <>
      <SEOSchema type="search" data={{ properties, totalResults: properties.length }} />
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
          <TabsTrigger value="search" className="flex items-center gap-1 text-xs sm:text-sm px-2">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Search</span>
            <span className="xs:hidden sm:inline">Search</span>
            <span className="xs:hidden">Find</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1 text-xs sm:text-sm px-2">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Advanced</span>
            <span className="xs:hidden sm:inline">Advanced</span>
            <span className="xs:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs sm:text-sm px-2">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:hidden">Analytics</span>
            <span className="xs:hidden sm:inline">Analytics</span>
            <span className="xs:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-1 text-xs sm:text-sm px-2">
            <span className="hidden xs:inline sm:hidden">Compare</span>
            <span className="xs:hidden sm:inline">Compare</span>
            <span className="xs:hidden">Comp</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1 order-2 lg:order-1">
              <div className="lg:sticky lg:top-4">
                <SearchFilters />
              </div>
            </aside>

            <main className="lg:col-span-3 order-1 lg:order-2">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold mb-2">{pageTitle}</h1>
          <div className="text-muted-foreground mb-6 text-sm sm:text-base">
            {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span>Searching properties...</span>
                </div>
            ) : (
                `Showing ${properties.length} results${promotedProperties.length > 0 ? ` (${promotedProperties.length} featured)` : ''}`
            )}
          </div>
          
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-56 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                ))}
             </div>
          ) : properties.length > 0 ? (
            <>
              {/* All Properties in Single Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {properties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
              
              {properties.length > itemsPerPage && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent className="flex-wrap justify-center gap-2">
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {getVisiblePages().map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
             <div className="text-center py-12 text-muted-foreground">
                <p className="font-semibold">No properties found.</p>
                <p className="text-sm">Try adjusting your search filters.</p>
            </div>
          )}

            </main>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <AdvancedSearch />
            </div>
            <div className="lg:col-span-1">
              <AIRecommendations />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-8">
          <MarketAnalytics />
        </TabsContent>

        <TabsContent value="compare" className="mt-8">
          <PropertyComparison properties={properties} />
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}

export default function SearchPageClient() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

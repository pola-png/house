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
import { fetchSearchProperties, type SearchPropertyResult } from "@/lib/search-properties";

interface SearchPageClientProps {
  initialResults: SearchPropertyResult;
  initialParamsKey: string;
}

function SearchContent({ initialResults, initialParamsKey }: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>(initialResults.properties as Property[]);
  const [promotedProperties, setPromotedProperties] = useState<Property[]>(initialResults.promotedProperties as Property[]);
  const [regularProperties, setRegularProperties] = useState<Property[]>(initialResults.regularProperties as Property[]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState(initialResults.pageTitle);
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
    
    setCurrentPage(1);

    const paramsKey = searchParams?.toString() ?? '';
    if (paramsKey === initialParamsKey) {
      setProperties(initialResults.properties as Property[]);
      setPromotedProperties(initialResults.promotedProperties as Property[]);
      setRegularProperties(initialResults.regularProperties as Property[]);
      setPageTitle(initialResults.pageTitle);
      setIsLoading(false);
      setFetchController(null);
      return;
    }

    // Clear previous results and show loading immediately
    setProperties([]);
    setPromotedProperties([]);
    setRegularProperties([]);
    setIsLoading(true);
    
    // Create new controller for this request
    const controller = new AbortController();
    setFetchController(controller);
    
    // Force immediate fetch
    fetchProperties(controller);
    
    return () => {
      controller.abort();
    };
  }, [searchParams?.toString()]);

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

      console.log('Executing query...');
      const results = await fetchSearchProperties({
        q,
        type: listingType || undefined,
        propertyTypes: allPropertyTypes,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        beds: beds || undefined,
        baths: baths || undefined,
        amenities,
      });
      console.log('Query results:', results.properties.length, 'properties');
      
      // Check if request was cancelled
      if (controller?.signal.aborted) {
        console.log('Request was cancelled, not updating state');
        return;
      }
      
      setPageTitle(results.pageTitle);
      setPromotedProperties(results.promotedProperties as Property[]);
      setRegularProperties(results.regularProperties as Property[]);
      setProperties(results.properties as Property[]);
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

export default function SearchPageClient(props: SearchPageClientProps) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SearchContent {...props} />
    </Suspense>
  );
}

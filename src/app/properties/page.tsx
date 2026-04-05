import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BRAND } from '@/lib/brand';
import { createPropertyUrl } from '@/lib/utils-seo';

const PAGE_SIZE = 24;

interface PropertiesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: PropertiesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || '1', 10) || 1);
  const canonical = page > 1 ? `${BRAND.siteUrl}/properties?page=${page}` : `${BRAND.siteUrl}/properties`;

  return {
    title: `All Properties | ${BRAND.name}`,
    description: `Browse all verified properties listed on ${BRAND.name}.`,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: properties, count } = await supabase
    .from('properties')
    .select('id, title, location, city, price, status, propertyType, bedrooms, updatedAt', { count: 'exact' })
    .in('status', ['Available', 'For Rent', 'For Sale'])
    .order('updatedAt', { ascending: false })
    .range(from, to);

  const totalResults = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold mb-3">All Properties</h1>
        <p className="text-muted-foreground mb-8">
          Browse {totalResults.toLocaleString()} property listings with direct links to each property page.
        </p>
      </div>

      {properties && properties.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((property) => (
              <article key={property.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold leading-snug">
                      <Link href={createPropertyUrl(property.id, property.title)} className="hover:text-primary">
                        {property.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {property.location}, {property.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">Ksh {Number(property.price).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{property.status}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1">{property.propertyType}</span>
                  <span className="rounded-full bg-muted px-3 py-1">{property.bedrooms} beds</span>
                </div>

                <div className="mt-4">
                  <Link href={createPropertyUrl(property.id, property.title)} className="text-sm font-medium text-primary hover:underline">
                    View property
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between gap-4">
            {page > 1 ? (
              <Link href={page === 2 ? '/properties' : `/properties?page=${page - 1}`} className="text-sm font-medium text-primary hover:underline">
                Previous page
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">Previous page</span>
            )}

            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>

            {page < totalPages ? (
              <Link href={`/properties?page=${page + 1}`} className="text-sm font-medium text-primary hover:underline">
                Next page
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">Next page</span>
            )}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">No properties are available right now.</p>
      )}
    </div>
  );
}

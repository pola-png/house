import { BRAND } from '@/lib/brand';

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

export function createPropertyUrl(id: string, title: string): string {
  return `/property/${createSlug(title)}-${id}`;
}

export function createAbsolutePropertyUrl(id: string, title: string): string {
  return `${BRAND.siteUrl}${createPropertyUrl(id, title)}`;
}

export function createPropertySlugUrl(id: string, title: string): string {
  const slug = createSlug(title);
  return `/${slug}-${id}`;
}

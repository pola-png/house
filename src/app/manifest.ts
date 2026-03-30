import { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} - Find Homes to Rent or Buy`,
    short_name: BRAND.shortName,
    description: `${BRAND.name} helps people search for homes to rent or buy.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#e67e22',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}


import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth-supabase';
import { SessionMonitor } from '@/components/session-monitor';
import { ConditionalLayout } from '@/components/conditional-layout';
import { NavigationLoader } from '@/components/navigation-loader';
import { CookieConsent } from '@/components/cookie-consent';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: `${BRAND.name} | Find Homes to Rent or Buy`,
    template: `%s | ${BRAND.name}`,
  },
  description: `${BRAND.name} helps people discover properties to rent or buy with simple search and direct support.`,
  keywords: [
    'house rent and buy', 'global property search', 'homes for rent worldwide', 'houses for sale worldwide',
    'rental homes', 'real estate marketplace', 'property search platform', 'apartments for rent',
    'homes for sale', 'verified property listings', 'property agents', 'rental marketplace',
    'buy property online', 'find apartments', 'find houses', 'property management',
    'landlords', 'tenants', 'real estate agents', 'global homes'
  ],
  authors: [{ name: BRAND.supportName }],
  creator: BRAND.name,
  publisher: BRAND.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: `${BRAND.name} | Find Homes to Rent or Buy`,
    description: `${BRAND.name} is a property platform for renting and buying homes with direct support.`,
    url: BRAND.siteUrl,
    siteName: BRAND.name,
    images: [
      {
        url: BRAND.logoPath,
        width: 1200,
        height: 630,
        alt: `${BRAND.name} logo`,
      },
    ],
    locale: 'en_US',
    type: 'website',
    countryName: 'Worldwide',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} | Find Homes to Rent or Buy`,
    description: `${BRAND.name} helps users browse homes for rent and sale.`,
    images: [BRAND.logoPath],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: BRAND.siteUrl,
    languages: {
      en: BRAND.siteUrl,
    },
  },
  category: 'Real Estate',
  classification: 'Property Rental Platform',
  referrer: 'origin-when-cross-origin',

  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  appleWebApp: {
    title: BRAND.name,
    statusBarStyle: 'default',
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.svg"/>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#e67e22"/>
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="preconnect" href="https://api.supabase.co" />
        <link rel="canonical" href={BRAND.siteUrl} />
        <meta name="msapplication-TileColor" content="#e67e22" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="language" content="English" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="1 days" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="google-site-verification" content="3eBr75nEzb0M1zIdIR6QOnu8n9ebWQr4aFrGvETzbuc" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6927256363821778"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": BRAND.name,
              "description": `${BRAND.name} helps people discover properties for rent and sale.`,
              "url": BRAND.siteUrl,
              "logo": `${BRAND.siteUrl}${BRAND.logoPath}`,
              "image": `${BRAND.siteUrl}${BRAND.logoPath}`,
              "telephone": BRAND.phone,
              "email": BRAND.email,
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "Worldwide"
              },
              "areaServed": "Worldwide",
              "serviceType": "Property Rental and Sales"
            })
          }}
        />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <AuthProvider>
          <NavigationLoader />
          <SessionMonitor />
          <ConditionalLayout>{children}</ConditionalLayout>
          <CookieConsent />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

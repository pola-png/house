
"use client";

import Link from 'next/link';
import { Menu, User, X, ChevronDown, ChevronUp, Briefcase, UserCircle, LogOut, Home, Settings, Search, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth-supabase';
import { BrandMark } from './brand-mark';

const navLinks = [
  { href: '/rentals-worldwide', label: 'To Rent' },
  { href: '/real-estate-for-sale', label: 'For Sale' },
  { href: '/developments', label: 'Developments' },
  { href: '/advice', label: 'Property Advice' },
  { href: '/agents', label: 'Find Agents' },
  { href: '/blog', label: 'Blog' },
  { href: '/support', label: 'Support' },
];

const seoPages = [
  { href: '/rentals-worldwide', label: 'Rentals Worldwide' },
  { href: '/family-homes-for-rent', label: 'Family Homes for Rent' },
  { href: '/city-properties', label: 'City Properties' },
  { href: '/1-bedroom-homes', label: '1 Bedroom Homes' },
  { href: '/2-bedroom-homes', label: '2 Bedroom Homes' },
  { href: '/3-bedroom-homes', label: '3 Bedroom Homes' },
  { href: '/budget-rentals', label: 'Budget Rentals' },
  { href: '/countries', label: 'Property by Country' },
  { href: '/real-estate-for-sale', label: 'Real Estate for Sale' },
  { href: '/homes-for-sale', label: 'Homes for Sale' },
  { href: '/houses-for-sale', label: 'Houses for Sale' },
  { href: '/property-for-sale', label: 'Property for Sale' },
  { href: '/real-estate-agents-near-me', label: 'Real Estate Agents Worldwide' },
];

export function Header() {
  const { user, logout, loading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const currentPathname = pathname ?? '/';
  const [searchQuery, setSearchQuery] = useState('');
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const isHomepage = currentPathname === '/';
  
  // Check if we're in admin mode by looking at localStorage and pathname
  const getIsAdminMode = () => {
    if (typeof window === 'undefined') return false;
    const viewMode = window.localStorage.getItem('adminViewMode');
    const adminRoots = ['/admin/admin-dashboard', '/admin/users', '/admin/analytics', '/admin/bulk-actions', '/admin/settings', '/admin/blog', '/admin/all-properties', '/admin/promotions', '/admin/payment-approvals', '/admin/system-settings', '/admin/leads', '/admin/my-team'];
    return viewMode === 'admin' && adminRoots.some(r => pathname?.startsWith(r));
  };
  
  const isAdminMode = getIsAdminMode();
  
  // Get the appropriate dashboard URL based on current context and history
  const getDashboardUrl = () => {
    if (typeof window === 'undefined') return '/admin/dashboard';
    
    // If user is admin, check their last visited dashboard or current context
    if (user?.role === 'admin') {
      // If currently on admin dashboard or admin pages, go to admin dashboard
      if (pathname?.startsWith('/admin/admin-dashboard') || isAdminMode) {
        return '/admin/admin-dashboard';
      }
      // If currently on agent dashboard or agent pages, go to agent dashboard
      if (pathname?.startsWith('/admin/dashboard') || pathname?.startsWith('/admin/properties') || pathname?.startsWith('/admin/profile')) {
        return '/admin/dashboard';
      }
      // Check localStorage for last visited dashboard
      const lastDashboard = window.localStorage.getItem('lastDashboard');
      return lastDashboard || '/admin/admin-dashboard'; // Default to admin dashboard for admins
    }
    
    // For agents, always go to agent dashboard
    return '/admin/dashboard';
  };
  
  const linkClasses = `text-sm font-medium transition-colors hover:text-primary ${isAdminMode ? 'dark:text-white text-white' : 'text-black'}`;
  const buttonBorderClasses = 'border-primary text-primary hover:bg-primary hover:text-primary-foreground';
  const textClasses = `${isAdminMode ? 'dark:text-white text-white' : 'text-black'}`;
  const logoTextClasses = `text-xl font-bold font-headline transition-colors ${isAdminMode ? 'dark:text-white text-white' : 'text-black'}`;

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getBreadcrumbs = () => {
    const segments = currentPathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/' }];
    
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      // Handle admin paths properly - only show one Dashboard
      if (segment === 'admin') {
        // For /admin path, show Dashboard and link to appropriate dashboard based on context
        const dashboardPath = getDashboardUrl();
        breadcrumbs.push({ label: 'Dashboard', href: dashboardPath });
        
        // Store the current dashboard in localStorage for future reference
        if (typeof window !== 'undefined') {
          if (currentPathname.includes('/admin/admin-dashboard')) {
            window.localStorage.setItem('lastDashboard', '/admin/admin-dashboard');
          } else if (currentPathname.includes('/admin/dashboard')) {
            window.localStorage.setItem('lastDashboard', '/admin/dashboard');
          }
        }
        return;
      } else if (segment === 'dashboard' || segment === 'admin-dashboard') {
        // Skip these segments as we already handled them above
        return;
      } else if (segment === 'all-properties') {
        label = 'All Properties';
      } else if (segment === 'properties' && segments[0] === 'admin') {
        label = 'My Properties';
      } else if (segment === 'new') {
        label = 'Add New';
      } else if (segment === 'edit') {
        label = 'Edit';
      }
      
      breadcrumbs.push({ label, href: currentPath });
    });
    
    return breadcrumbs;
  };

  const renderUserAuth = ({ mobile = false }) => {
    if (isUserLoading) {
      return <Skeleton className="h-10 w-24" />;
    }

    if (user) {
      if (mobile) {
        return (
          <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground px-4">My Account</p>
              {(user.role === 'agent' || user.role === 'admin') && (
                <SheetClose asChild>
                    <Link href={getDashboardUrl()} className="flex items-center gap-2 p-4 text-lg font-medium transition-colors hover:text-primary"><Home className="h-5 w-5"/> Dashboard</Link>
                </SheetClose>
              )}
              <SheetClose asChild>
                  <Link href="/admin/profile" className="flex items-center gap-2 p-4 text-lg font-medium transition-colors hover:text-primary"><UserCircle className="h-5 w-5"/> Profile</Link>
              </SheetClose>
              <SheetClose asChild>
                  <Link href="/admin/settings" className="flex items-center gap-2 p-4 text-lg font-medium transition-colors hover:text-primary"><Settings className="h-5 w-5"/> Settings</Link>
              </SheetClose>
              <Separator className="my-2"/>
              <SheetClose asChild>
                  <Button onClick={handleLogout} variant="ghost">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
              </SheetClose>
          </div>
        );
      }
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName ?? 'User'} />}
                <AvatarFallback>
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(user.role === 'agent' || user.role === 'admin') && (
              <DropdownMenuItem asChild>
                <Link href={getDashboardUrl()}>Dashboard</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/admin/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/admin/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    
    if (mobile) {
      return (
          <div className="flex flex-col gap-2">
              <SheetClose asChild>
                  <Button asChild>
                      <Link href="/login"><UserCircle className="mr-2 h-4 w-4" /> Sign In as User</Link>
                  </Button>
              </SheetClose>
              <SheetClose asChild>
                  <Button asChild variant="secondary">
                      <Link href="/signup/agent"><Briefcase className="mr-2 h-4 w-4" /> Register as Agent</Link>
                  </Button>
              </SheetClose>
          </div>
      );
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button>
            <User className="mr-2 h-4 w-4" /> Sign In <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Choose account type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
            <Link href="/login">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>User</span>
            </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
            <Link href="/signup/agent">
            <Briefcase className="mr-2 h-4 w-4" />
            <span>Agent</span>
            </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isAdminMode ? 'bg-black shadow-md' : 'bg-background shadow-md'}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark textClassName={logoTextClasses} />
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={linkClasses}
                >
                  {link.label}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`text-sm font-medium ${textClasses} hover:text-primary`}>
                    Browse Properties <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {seoPages.map((page) => (
                    <DropdownMenuItem key={page.href} asChild>
                      <Link href={page.href} className="text-sm">
                        {page.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
            
            {!isHomepage && (
              <Link href="/search">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {user && (user.role === 'agent' || user.role === 'admin') && (
              <Link href="/admin/properties/new">
                <Button variant="outline" className={buttonBorderClasses}>
                  List your property
                </Button>
              </Link>
            )}
            {renderUserAuth({ mobile: false })}
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={`${textClasses} hover:bg-black/20 dark:hover:bg-white/20`}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-background p-0 flex flex-col max-h-screen">
                {/* A11y: Provide required title/description for dialog semantics */}
                <div className="sr-only">
                  <SheetTitle>Mobile Navigation</SheetTitle>
                  <SheetDescription>Site menu</SheetDescription>
                </div>
                <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                   <Link href="/" className="flex items-center gap-2">
                      <BrandMark />
                  </Link>
                  <SheetClose asChild>
                     <Button variant="ghost" size="icon">
                       <X className="h-6 w-6" />
                     </Button>
                  </SheetClose>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {!isHomepage && (
                    <div className="p-4 border-b">
                      <SheetClose asChild>
                        <Link href="/search">
                          <Button variant="ghost" className="w-full justify-start">
                            <Search className="mr-2 h-4 w-4" />
                            Search Properties
                          </Button>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                  <nav className="flex flex-col gap-1 p-4">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={`${link.href}-${link.label}`}>
                        <Link
                          href={link.href}
                          className="text-lg font-medium transition-colors hover:text-primary py-2"
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <Separator className="my-2" />
                    <button
                      onClick={() => setIsBrowseOpen(!isBrowseOpen)}
                      className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground px-2 py-2 hover:text-primary transition-colors"
                    >
                      <span>Browse Properties</span>
                      {isBrowseOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {isBrowseOpen && (
                      <div className="ml-2 border-l border-muted pl-2 space-y-1">
                        {seoPages.map((page) => (
                          <SheetClose asChild key={page.href}>
                            <Link
                              href={page.href}
                              className="block text-sm font-medium transition-colors hover:text-primary py-1 px-2"
                            >
                              {page.label}
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    )}
                  </nav>
                </div>
                
                <div className="p-4 border-t flex flex-col gap-4 flex-shrink-0">
                  {user && (user.role === 'agent' || user.role === 'admin') && (
                    <SheetClose asChild>
                      <Link href="/admin/properties/new">
                        <Button variant="outline" className='border-primary text-primary'>
                          List your property
                        </Button>
                      </Link>
                    </SheetClose>
                  )}
                   <Separator />
                   {renderUserAuth({ mobile: true })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Breadcrumb Navigation */}
        {!isHomepage && (
          <div className="border-t py-2">
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  {index > 0 && <ChevronRight className="h-4 w-4" />}
                  <Link
                    href={crumb.href}
                    className={`hover:text-primary transition-colors ${
                      index === getBreadcrumbs().length - 1 ? 'text-foreground font-medium' : ''
                    }`}
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

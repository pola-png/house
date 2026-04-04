"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SEOSchema } from '@/components/seo-schema';
import { OptimizedImage } from '@/components/optimized-image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyCard } from '@/components/property-card';
import Link from 'next/link';
import { MapPin, Bed, Bath, Maximize, Phone, Mail, Share2, Heart, MessageSquare, Eye, Calendar, Edit, Star, Copy, Trash2, ChevronLeft, ChevronRight, X, ZoomIn, Wifi, Car, Shield, Zap, Droplets, Wind, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth-supabase';
import { useRouter } from 'next/navigation';
import { trackPropertyView } from '@/lib/view-tracking';
import { toWasabiProxyPath } from '@/lib/wasabi';

const Image = ((props: any) => <OptimizedImage fit="contain" sizes="100vw" fallbackSrc={null} {...props} />) as any;

function coerceImages(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
}

const amenityIcons: Record<string, any> = {
  'WiFi': Wifi,
  'Internet': Wifi,
  'Parking': Car,
  'Security': Shield,
  'Electricity': Zap,
  'Water': Droplets,
  'Air Conditioning': Wind,
};

interface PropertyDetailClientProps {
  id: string;
  initialProperty?: Property | null;
}

export default function PropertyDetailClient({ id, initialProperty = null }: PropertyDetailClientProps) {
  const [property, setProperty] = useState<Property | null>(initialProperty);
  const [loading, setLoading] = useState(!initialProperty);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relevantProperties, setRelevantProperties] = useState<Property[]>([]);
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [loadingMoreProperties, setLoadingMoreProperties] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const handleShare = async () => {
    try {
      const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
      const title = property?.title || 'Property';
      const text = `${title} – ${property?.location || ''}, ${property?.city || ''}`.trim();
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        toast({ title: 'Shared', description: 'Link shared successfully.' });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link Copied', description: 'Property link copied to clipboard.' });
      }
    } catch (e: any) {
      try {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link Copied', description: 'Property link copied to clipboard.' });
      } catch {}
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (initialProperty) {
      setProperty(initialProperty);
      setLoading(false);
    }
  }, [initialProperty]);

  useEffect(() => {
    if (property) {
      fetchRelevantProperties(property);
    }
  }, [property]);

  const fetchProperty = async () => {
    try {
      let actualId = id;
      if (id.includes('-')) {
        const parts = id.split('-');
        if (parts.length >= 5) {
          actualId = parts.slice(-5).join('-');
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`/api/properties/${actualId}`, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Failed to load property (${res.status})`);
      const data = await res.json();

      const images = coerceImages(data.images)
        .map((img) => toWasabiProxyPath(img))
        .filter((img): img is string => Boolean(img));

      let agentProfile = data?.landlord;
      if (!agentProfile || !agentProfile.email || !agentProfile.phoneNumber) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.landlordId)
            .single();
          if (prof) agentProfile = { ...agentProfile, ...prof };
        } catch {}
      }

      const agent = agentProfile ? {
        uid: agentProfile.id,
        firstName: agentProfile.firstName || '',
        lastName: agentProfile.lastName || '',
        displayName: agentProfile.displayName || agentProfile.email?.split('@')[0] || '',
        email: agentProfile.email || '',
        role: (agentProfile.role as any) || 'agent',
        agencyName: agentProfile.agencyName,
        phoneNumber: agentProfile.phoneNumber,
        photoURL: agentProfile.photoURL,
        createdAt: agentProfile.createdAt ? new Date(agentProfile.createdAt) : new Date()
      } : undefined;

      setProperty({
        ...data,
        images,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        agent,
      });

      setCurrentImageIndex(0);

      try {
        const newViewCount = await trackPropertyView(actualId);
        if (newViewCount > 0) {
          setProperty((prev) => prev ? { ...prev, views: newViewCount } : prev);
        }
      } catch (viewError) {
        console.error('Error tracking property view:', viewError);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelevantProperties = async (currentProperty: any, limit: number = 6) => {
    try {
      console.log('Fetching properties for:', currentProperty.title);
      
      // Use the same approach as landing pages
      let query = supabase.from('properties').select('*');
      
      // Exclude current property
      query = query.neq('id', currentProperty.id);
      
      // Filter by location OR property type OR bedrooms (similar properties)
      query = query.or(`location.ilike.%${currentProperty.location}%,propertyType.ilike.%${currentProperty.propertyType}%,bedrooms.eq.${currentProperty.bedrooms}`);
      
      // Order by promotion status first, then by creation date (same as landing pages)
      query = query
        .order('isPremium', { ascending: false, nullsFirst: false })
        .order('createdAt', { ascending: false })
        .limit(limit);

      const { data } = await query;
      console.log('Properties found:', data?.length || 0);
      
      if (!data || data.length === 0) {
        // Fallback: get any properties if no similar ones found
        const fallbackQuery = supabase.from('properties')
          .select('*')
          .neq('id', currentProperty.id)
          .order('isPremium', { ascending: false, nullsFirst: false })
          .order('createdAt', { ascending: false })
          .limit(limit);
          
        const { data: fallbackData } = await fallbackQuery;
        if (fallbackData && fallbackData.length > 0) {
          const mapped = await mapPropertiesWithAgents(fallbackData);
          setRelevantProperties(mapped);
        }
        return;
      }

      // Map properties with agent data (same as landing pages)
      const mapped = await mapPropertiesWithAgents(data);
      setRelevantProperties(mapped);
      console.log('Properties set:', mapped.length);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const loadMoreProperties = async () => {
    if (!property) return;
    setLoadingMoreProperties(true);
    await fetchRelevantProperties(property, 18);
    setShowAllProperties(true);
    setLoadingMoreProperties(false);
  };

  const mapPropertiesWithAgents = async (properties: any[]) => {
    // Get agent profiles (same as landing pages)
    const landlordIds = [...new Set(properties.map(p => p.landlordId))];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', landlordIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Map properties with agent data (same as landing pages)
    return properties.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      agent: profileMap.get(p.landlordId) ? {
        uid: profileMap.get(p.landlordId)!.id,
        firstName: profileMap.get(p.landlordId)!.firstName || '',
        lastName: profileMap.get(p.landlordId)!.lastName || '',
        displayName: profileMap.get(p.landlordId)!.displayName || '',
        email: profileMap.get(p.landlordId)!.email || '',
        role: 'agent' as const,
        agencyName: profileMap.get(p.landlordId)!.agencyName,
        phoneNumber: profileMap.get(p.landlordId)!.phoneNumber,
        photoURL: profileMap.get(p.landlordId)!.photoURL,
        createdAt: new Date(profileMap.get(p.landlordId)!.createdAt)
      } : undefined
    }));
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property?.id);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Property deleted successfully.' });
      router.push('/admin/properties');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete property.' });
    }
  };

  const handleDuplicate = () => {
    if (property) {
      localStorage.setItem('duplicateProperty', JSON.stringify(property));
      router.push('/admin/properties/new');
      toast({ title: 'Property data copied', description: 'Edit and save to create a duplicate.' });
    }
  };

  const handleCallbackRequest = async () => {
    if (!callbackName || !callbackPhone) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('callback_requests').insert({
        propertyId: property?.id,
        userName: callbackName,
        userPhone: callbackPhone,
        agentId: property?.landlordId,
        status: 'pending'
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Callback request sent! Agent will contact you soon.' });
      setShowCallbackForm(false);
      setCallbackName('');
      setCallbackPhone('');
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to send request', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full mb-4" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Property not found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SEOSchema type="property" data={property} />

      {/* Lightbox Modal */}
      {showLightbox && property.images && property.images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setShowLightbox(false)}>
          <button
            className="absolute top-4 right-4 z-[60] p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setShowLightbox(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <Image
              src={property.images[currentImageIndex]}
              alt={property.title}
              fill
              className="object-contain"
            />
            {property.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev === 0 ? property.images!.length - 1 : prev - 1));
                  }}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev === property.images!.length - 1 ? 0 : prev + 1));
                  }}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8" itemScope itemType="https://schema.org/Accommodation">
        {user && property.landlordId === user.uid && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild className="hover:bg-blue-100">
                  <Link href={`/admin/properties/edit/${property.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Property
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="hover:bg-green-100">
                  <Link href={`/admin/properties/promote?propertyId=${property.id}`}>
                    <Star className="h-4 w-4 mr-2" />
                    Promote Property
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={handleDuplicate} className="hover:bg-purple-100">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Property
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Property
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Modern Image Gallery */}
            <Card className="overflow-hidden shadow-xl">
              <div className="relative">
                {property.images && property.images.length > 0 ? (
                  <>
                    <div className="relative h-[60vh] group cursor-pointer" onClick={() => setShowLightbox(true)}>
                      <Image
                        src={property.images[currentImageIndex]}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowLightbox(true);
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      
                      {property.images.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => (prev === 0 ? property.images!.length - 1 : prev - 1));
                            }}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => (prev === property.images!.length - 1 ? 0 : prev + 1));
                            }}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {/* Image Thumbnails */}
                    {property.images.length > 1 && (
                      <div className="p-4 bg-muted/30">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {property.images.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentImageIndex ? 'border-primary shadow-lg' : 'border-transparent hover:border-muted-foreground/30'
                              }`}
                            >
                              <Image
                                src={image}
                                alt={`${property.title} - Image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-96 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <span className="text-muted-foreground text-lg">No images available</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Property Header */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1">
                        {property.propertyType}
                      </Badge>
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        {property.status}
                      </Badge>
                      {property.isPremium && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          FEATURED
                        </Badge>
                      )}
                    </div>
                    
                    <h1 className="text-4xl font-bold mb-4 leading-tight" itemProp="name">
                      {property.title}
                    </h1>
                    
                    <div className="flex items-center text-muted-foreground mb-6" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-lg" itemProp="addressLocality">{property.location}</span>
                      <span className="mx-2">•</span>
                      <span className="text-lg" itemProp="addressRegion">{property.city}</span>
                    </div>
                    
                    {/* Key Features Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Bed className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{property.bedrooms}</div>
                          <div className="text-sm text-muted-foreground">Bedrooms</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Bath className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{property.bathrooms}</div>
                          <div className="text-sm text-muted-foreground">Bathrooms</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Maximize className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{property.area.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Sq Ft</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Eye className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{property.views || 0}</div>
                          <div className="text-sm text-muted-foreground">Views</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary mb-2" itemProp="priceRange">
                      Ksh {property.price.toLocaleString()}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {property.status === 'For Sale' ? 'Total Price' : 'Per Month'}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Listed {new Date(property.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Card className="shadow-lg">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="amenities">Amenities</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="p-6">
                  <div className="prose max-w-none">
                    <h3 className="text-xl font-bold mb-4">About This Property</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{property.description}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="amenities" className="p-6">
                  <h3 className="text-xl font-bold mb-4">Amenities & Features</h3>
                  {property.amenities && property.amenities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {property.amenities.map((amenity, index) => {
                        const IconComponent = amenityIcons[amenity] || Shield;
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <IconComponent className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No amenities listed for this property.</p>
                  )}
                </TabsContent>
                
                <TabsContent value="location" className="p-6">
                  <h3 className="text-xl font-bold mb-4">Location Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">{property.location}</div>
                        <div className="text-sm text-muted-foreground">{property.city}, Kenya</div>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      This property is located in {property.location}, {property.city}. 
                      Contact the agent for more specific location details and nearby amenities.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar - Agent Contact */}
          <div className="xl:col-span-1">
            <Card className="sticky top-24 shadow-xl">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-6 text-center">Contact Agent</h3>
                
                {/* Agent Profile */}
                <div className="text-center mb-6">
                  {property.agent ? (
                    <>
                      <Avatar className="h-20 w-20 mx-auto mb-4">
                        <AvatarImage src={property.agent.photoURL} alt={property.agent.displayName} />
                        <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                          {property.agent.displayName?.charAt(0).toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-bold text-lg flex items-center justify-center gap-2">
                        {property.agent.displayName}
                        {(property.isPremium || (property.featuredExpiresAt && new Date(property.featuredExpiresAt) > new Date())) && (
                          <>
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1">
                              PRO
                            </Badge>
                            <span className="text-yellow-500" title="Premium Agent">
                              👑
                            </span>
                          </>
                        )}
                      </div>
                      {property.agent.agencyName && (
                        <div className="text-sm text-muted-foreground mb-2">{property.agent.agencyName}</div>
                      )}
                      {property.agent.phoneNumber && (
                        <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                          <Phone className="h-4 w-4" />
                          {property.agent.phoneNumber}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">
                        Agent details unavailable. Request a callback and we'll notify the listing owner.
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {property.agent?.phoneNumber && (
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" asChild>
                      <a href={`tel:${property.agent.phoneNumber}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </a>
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary hover:text-white" 
                    onClick={() => setShowCallbackForm(!showCallbackForm)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {showCallbackForm ? 'Cancel Request' : 'Request Callback'}
                  </Button>

                  {property.agent?.email && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`mailto:${property.agent.email}?subject=Inquiry about ${property.title}&body=Hi, I'm interested in this property: ${typeof window !== 'undefined' ? window.location.href : ''}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </a>
                    </Button>
                  )}
                </div>

                {/* Callback Form */}
                {showCallbackForm && (
                  <Card className="mt-6 border-primary/20">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-semibold text-center">Request Callback</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="callback-name">Your Name</Label>
                          <Input
                            id="callback-name"
                            value={callbackName}
                            onChange={(e) => setCallbackName(e.target.value)}
                            placeholder="Enter your full name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="callback-phone">Phone Number</Label>
                          <Input
                            id="callback-phone"
                            value={callbackPhone}
                            onChange={(e) => setCallbackPhone(e.target.value)}
                            placeholder="Enter your phone number"
                            className="mt-1"
                          />
                        </div>
                        <Button 
                          onClick={handleCallbackRequest} 
                          disabled={isSubmitting || !callbackName || !callbackPhone} 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          {isSubmitting ? 'Sending...' : 'Send Request'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator className="my-6" />
                
                {/* Property Stats */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Property Stats</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="font-bold text-lg">{property.views || 0}</div>
                      <div className="text-muted-foreground">Total Views</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="font-bold text-lg">
                        {Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-muted-foreground">Days Listed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* View More Properties Button */}
        <div className="mt-12 text-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={loadMoreProperties}
            disabled={loadingMoreProperties}
          >
            {loadingMoreProperties ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              `View More Properties in ${property.location}`
            )}
          </Button>
        </div>

        {/* Relevant Properties Section */}
        <div className="mt-8">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Similar Properties</h2>
              {relevantProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relevantProperties.map((relatedProperty) => (
                    <PropertyCard key={relatedProperty.id} property={relatedProperty} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No similar properties found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

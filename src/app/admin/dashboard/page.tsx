'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Home, Package, Users, List, Building, MapPin, Bed, Bath, Maximize, TrendingUp, TrendingDown, Eye, Calendar, Star, Activity, BarChart3, Zap } from "lucide-react";
import type { Property, CallbackRequest } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketAnalytics } from "@/components/market-analytics";
import { SmartNotifications } from "@/components/smart-notifications";
import { RealAgentRating } from "@/components/real-agent-rating";
import Link from "next/link";
import Image from "next/image";
import { OptimizedImage } from "@/components/optimized-image";
import placeholderImages from "@/lib/placeholder-images.json";
import { formatDistanceToNow } from 'date-fns';
import { useMemo, useState, useEffect } from "react";
import { useAutoRetry } from "@/hooks/use-auto-retry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth-supabase";
import { supabase } from "@/lib/supabase";
import { normalizeWasabiImageArray } from "@/lib/wasabi";
import { createPropertyUrl } from "@/lib/utils-seo";

export default function Dashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<CallbackRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryTick, retryNow] = useAutoRetry(isLoading || !user, [user]);
  const hardReload = () => window.location.reload();
  const [realTimeStats, setRealTimeStats] = useState({
    totalViews: 0,
    todayViews: 0,
    weeklyGrowth: 0,
    responseRate: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      const { data: propertiesData, error: propsError } = await supabase
        .from('properties')
        .select('*')
        .eq('landlordId', user.uid)
        .order('createdAt', { ascending: false });

      if (propsError) throw propsError;

      const typedProperties: Property[] = (propertiesData || []).map(p => ({
        ...p,
        images: normalizeWasabiImageArray(p.images),
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        agent: {
          uid: user.uid,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          agencyName: user.agencyName,
          photoURL: user.photoURL,
          createdAt: user.createdAt
        }
      }));

      setProperties(typedProperties);
      setRecentProperties(typedProperties.slice(0, 5));
      
      // Calculate real-time stats
      const totalViews = typedProperties.reduce((sum, p) => sum + (p.views || 0), 0);
      const todayViews = 0; // No fake data
      const weeklyGrowth = 0; // No fake data
      
      setRealTimeStats({
        totalViews,
        todayViews,
        weeklyGrowth,
        responseRate: 0, // No fake data
        avgResponseTime: 0 // No fake data
      });

      const { data: leadsData, error: leadsError } = await supabase
        .from('callback_requests')
        .select('*')
        .eq('agentId', user.uid)
        .order('createdAt', { ascending: false });

      if (!leadsError && leadsData) {
        const typedLeads: CallbackRequest[] = leadsData.map(l => ({
          ...l,
          createdAt: new Date(l.createdAt)
        }));
        setLeads(typedLeads);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!properties) return null;
    const activeListings = properties.filter(p => 
      p.status === 'For Rent' || 
      p.status === 'For Sale' || 
      p.status === 'Short Let'
    );
    const rentedProperties = properties.filter(p => p.status === 'Rented');
    const soldProperties = properties.filter(p => p.status === 'Sold');
    const totalProperties = properties.length;
    const actualMonthlyIncome = [...rentedProperties, ...soldProperties].reduce((sum, p) => sum + p.price, 0);

    return {
      totalProperties,
      activeRentals: activeListings.length,
      actualMonthlyIncome,
    };
  }, [properties]);

  const totalLeads = useMemo(() => leads?.length || 0, [leads]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
            {user?.role === 'admin' ? 'Agent View Dashboard' : 'Agent Dashboard'}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {user?.role === 'admin' ? 'Agent perspective of the platform' : 'Welcome back! Here\'s your property performance overview.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch to Admin in-line button for admins in agent mode */}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => {
                try {
                  // Open the reauth overlay in admin layout
                  // @ts-ignore
                  try { window.localStorage.setItem('adminViewMode', 'admin'); } catch {}
                window.location.href = '/admin/admin-dashboard';
                } catch {}
              }}
              className="text-sm font-bold underline text-primary mr-2"
              aria-label="Switch to Admin Dashboard"
            >
              Switch to Admin
            </button>
          )}
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            <Zap className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          {user?.role === 'admin' ? (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
              Agent Mode
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs hidden sm:inline-flex">
              Real-time Analytics
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-10 -mt-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2"><Skeleton className="h-8 w-16" /><button className="text-xs underline whitespace-nowrap" onClick={hardReload}>Reload now</button></div>) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stats?.totalProperties}</div>
                    {(stats?.totalProperties ?? 0) > 0 && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Package className="h-3 w-3 mr-1" />
                        Total portfolio
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Portfolio size</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                <Home className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2"><Skeleton className="h-8 w-16" /><button className="text-xs underline whitespace-nowrap" onClick={hardReload}>Reload now</button></div>) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{stats?.activeRentals}</div>
                    <div className="flex items-center text-xs">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                        <div className="bg-green-600 h-1.5 rounded-full" style={{width: `${(stats?.activeRentals || 0) / (stats?.totalProperties || 1) * 100}%`}}></div>
                      </div>
                      {Math.round((stats?.activeRentals || 0) / (stats?.totalProperties || 1) * 100)}% active
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Available for rent</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-10 -mt-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2"><Skeleton className="h-8 w-16" /><button className="text-xs underline whitespace-nowrap" onClick={hardReload}>Reload now</button></div>) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{realTimeStats.totalViews.toLocaleString()}</div>
                    {realTimeStats.todayViews > 0 && (
                      <div className="flex items-center text-xs text-blue-600">
                        <Eye className="h-3 w-3 mr-1" />
                        {realTimeStats.todayViews} today
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Property views</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -mr-10 -mt-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2"><Skeleton className="h-8 w-16" /><button className="text-xs underline whitespace-nowrap" onClick={hardReload}>Reload now</button></div>) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      Ksh {stats?.actualMonthlyIncome.toLocaleString('en-KE', { maximumFractionDigits: 0 })}
                    </div>
                    {realTimeStats.weeklyGrowth !== 0 && (
                      <div className="flex items-center text-xs">
                        {realTimeStats.weeklyGrowth >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                        )}
                        <span className={realTimeStats.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {realTimeStats.weeklyGrowth >= 0 ? '+' : ''}{realTimeStats.weeklyGrowth.toFixed(1)}% this week
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Actual earnings</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Performance Metrics */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Response Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{realTimeStats.responseRate.toFixed(1)}%</div>
                  <Progress value={realTimeStats.responseRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">{realTimeStats.responseRate > 0 ? 'Response performance' : 'No data yet'}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{Math.round(realTimeStats.avgResponseTime)}min</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {realTimeStats.avgResponseTime > 0 ? 'Average time' : 'No data'}
                  </div>
                  <p className="text-xs text-muted-foreground">Response speed</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Agent Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealAgentRating key={user?.uid} />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Listings</CardTitle>
            <CardDescription>An overview of the latest properties you've added.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : recentProperties && recentProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recentProperties.map((property) => {
                    const images = Array.isArray(property.images) ? property.images : [];
                    const imageUrl = images.length > 0 ? images[0] : null;
                    return (
                      <Link key={property.id} href={createPropertyUrl(property.id, property.title)} className="group block">
                        <div className="rounded-lg border overflow-hidden bg-card hover:shadow-sm transition">
                          <div className="relative w-full aspect-[4/3]">
                            {imageUrl ? (
                              <OptimizedImage
                                src={imageUrl}
                                alt={property.title}
                                fill
                                fit="cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                className="object-center"
                              />
                            ) : (
                              <div className="h-full w-full bg-secondary flex items-center justify-center">
                                <Building className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-3 space-y-1">
                            <h3 className="font-semibold line-clamp-2 break-words hyphens-auto leading-snug">{property.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3" /> {property.location}, {property.city}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{property.bedrooms}</span>
                                <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{property.bathrooms}</span>
                                <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{property.area} ft²</span>
                              </div>
                              <Badge variant={property.status === 'Rented' ? 'destructive' : 'default'}>{property.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(property.createdAt, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <List className="h-12 w-12 mx-auto mb-4" />
                <p className="font-semibold">No recent listings found.</p>
                <p className="text-sm">Add a new property to see it here.</p>
                 <Button size="sm" asChild className="mt-4">
                    <Link href="/admin/properties/new">Post a Property</Link>
                 </Button>
              </div>
            )}
              </CardContent>
            </Card>
            
            <div className="xl:col-span-1">
              <SmartNotifications key={user?.uid} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <MarketAnalytics />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProperties.slice(0, 3).map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium truncate">{property.title}</p>
                        <p className="text-sm text-muted-foreground">{property.views || 0} views</p>
                      </div>
                      <Badge variant={property.views && property.views > 50 ? "default" : "secondary"}>
                        {property.views && property.views > 50 ? "High" : "Low"} Traffic
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Weekly Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {recentProperties.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Total properties: {properties.length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Total views: {realTimeStats.totalViews}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Active listings: {stats?.activeRentals || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No insights available yet</p>
                    <p className="text-sm">Add properties to see performance insights</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                    <h4 className="font-semibold text-blue-900 mb-2">Your Performance</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• You have {properties.length} {properties.length === 1 ? 'property' : 'properties'} listed</li>
                      <li>• Total views across all properties: {realTimeStats.totalViews}</li>
                      <li>• Active listings: {stats?.activeRentals || 0}</li>
                      {realTimeStats.totalViews === 0 && <li>• Add photos and descriptions to get more views</li>}
                    </ul>
                  </div>
                  
                  {realTimeStats.totalViews > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
                      <h4 className="font-semibold text-green-900 mb-2">Activity Summary</h4>
                      <ul className="space-y-2 text-sm text-green-800">
                        <li>• Average views per property: {Math.round(realTimeStats.totalViews / properties.length)}</li>
                        <li>• Properties generating interest: {properties.filter(p => (p.views || 0) > 0).length}</li>
                        <li>• Response rate: {realTimeStats.responseRate.toFixed(1)}%</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold">No insights available yet</p>
                  <p className="text-sm mb-4">Post your first property to get AI-powered insights</p>
                  <Button size="sm" asChild>
                    <Link href="/admin/properties/new">Post a Property</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

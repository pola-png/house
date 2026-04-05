"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth-supabase";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Image as ImageIcon, ExternalLink, Activity, Search, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createPropertyUrl } from "@/lib/utils-seo";

interface PaymentRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentScreenshot: string;
  status: "pending" | "approved" | "rejected";
  promotionType: "featured" | "premium";
  createdAt: string;
}

export default function PaymentApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.role !== "admin") {
      router.push("/admin/dashboard");
      return;
    }
    fetchPaymentRequests();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(fetchPaymentRequests, 30000);
    return () => clearInterval(interval);
  }, [user, router]);

  const fetchPaymentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching payment requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string, propertyId: string, promotionType: string) => {
    try {
      // Extract weeks from promotionType (e.g., "Featured - 2 weeks")
      const weeksMatch = promotionType.match(/(\d+)\s*week/);
      const weeks = weeksMatch ? parseInt(weeksMatch[1]) : 4;

      console.log('Promoting property:', propertyId, 'for', weeks, 'weeks');

      // Use RPC function to promote property (bypasses RLS)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('promote_property', {
          property_id: propertyId,
          weeks_count: weeks
        });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw rpcError;
      }

      console.log('Property promoted via RPC:', rpcData);

      // Update payment request status
      const { error: paymentError } = await supabase
        .from("payment_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (paymentError) throw paymentError;

      toast({
        title: "Payment Approved",
        description: "Property has been promoted successfully.",
      });

      fetchPaymentRequests();
    } catch (error: any) {
      console.error("Error approving payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve payment.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Payment Rejected",
        description: "Payment request has been rejected.",
      });

      fetchPaymentRequests();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast({
        title: "Error",
        description: "Failed to reject payment.",
        variant: "destructive",
      });
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  if (user?.role !== "admin") return null;

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions & Payments</h1>
          <p className="text-muted-foreground">Manage property promotions and payment approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Live Updates
          </Badge>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <div className="text-xs text-muted-foreground">Awaiting approval</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests.length}</div>
            <div className="text-xs text-muted-foreground">Successfully processed</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedRequests.length}</div>
            <div className="text-xs text-muted-foreground">Declined requests</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Ksh {approvedRequests.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">From approved payments</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by property, user, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Pend</span> ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Approved</span>
            <span className="sm:hidden">Appr</span> ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Rejected</span>
            <span className="sm:hidden">Rej</span> ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredRequests.filter(r => r.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending payment requests
              </CardContent>
            </Card>
          ) : (
            filteredRequests.filter(r => r.status === 'pending').map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative w-full md:w-48 h-48 bg-muted rounded-lg overflow-hidden cursor-pointer"
                           onClick={() => setSelectedImage(request.paymentScreenshot)}>
                        {request.paymentScreenshot ? (
                          <Image
                            src={request.paymentScreenshot}
                            alt="Payment Screenshot"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{request.propertyTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted by {request.userName} ({request.userEmail})
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {request.promotionType === "featured" ? "Featured Listing" : "Premium Listing"}
                        </Badge>
                        <Badge variant="secondary">
                          Ksh {request.amount.toLocaleString()}
                        </Badge>
                        <Badge variant="outline">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                          onClick={() => handleApprove(request.id, request.propertyId, request.promotionType)}
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          variant="destructive"
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="sm:w-auto"
                        >
                          <a href={createPropertyUrl(request.propertyId, request.propertyTitle)} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{request.propertyTitle}</h3>
                    <p className="text-sm text-muted-foreground">{request.userName}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{request.promotionType}</Badge>
                      <Badge>Ksh {request.amount.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{request.propertyTitle}</h3>
                    <p className="text-sm text-muted-foreground">{request.userName}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{request.promotionType}</Badge>
                      <Badge>Ksh {request.amount.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Rejected
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Payment Screenshot"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Bike, DollarSign, MapPin, Package, CheckCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import DeliveryFlow from "./DeliveryFlow";
import { DashboardNav } from "@/components/DashboardNav";

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: riderProfile } = useQuery({
    queryKey: ["rider-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: availableOrders } = useQuery({
    queryKey: ["available-deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          vendors:vendor_id (name, location),
          profiles:customer_id (full_name)
        `)
        .eq("status", "ready")
        .is("rider_id", null);

      if (error) throw error;
      return data;
    },
  });

  const { data: myDeliveries } = useQuery({
    queryKey: ["my-deliveries", riderProfile?.user_id],
    queryFn: async () => {
      if (!riderProfile) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          vendors:vendor_id (name, location),
          profiles:customer_id (full_name)
        `)
        .eq("rider_id", riderProfile.user_id)
        .in("status", ["assigned", "picked_up", "in_transit"]);

      if (error) throw error;
      return data;
    },
    enabled: !!riderProfile,
  });

  const { data: allDeliveries } = useQuery({
    queryKey: ["all-deliveries", riderProfile?.user_id],
    queryFn: async () => {
      if (!riderProfile) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("rider_id", riderProfile.user_id);

      if (error) throw error;
      return data;
    },
    enabled: !!riderProfile,
  });

  // Real-time subscriptions
  useEffect(() => {
    const availableChannel = supabase
      .channel("available-deliveries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: "status=eq.ready",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["available-deliveries"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(availableChannel);
    };
  }, [queryClient]);

  const acceptDelivery = useMutation({
    mutationFn: async (orderId: string) => {
      if (!riderProfile) throw new Error("Rider profile not found");

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const { error } = await supabase
        .from("orders")
        .update({
          rider_id: riderProfile.user_id,
          status: "assigned" as any,
          otp_code: otp,
        })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["my-deliveries"] });
      toast({ title: "Delivery accepted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeDeliveries = myDeliveries || [];

  const menuItems = [
    { label: "Dashboard", href: "/rider/dashboard", icon: <Bike className="h-4 w-4" /> },
    { label: "Deliveries", href: "/rider/dashboard", icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardNav userEmail={userEmail} userRole="rider" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Rider Dashboard</h1>
          <p className="text-muted-foreground">Manage your deliveries and track your earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDeliveries.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Deliveries</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allDeliveries?.filter((d: any) => 
                  new Date(d.created_at).toDateString() === new Date().toDateString()
                ).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{(allDeliveries?.filter((d: any) => 
                  new Date(d.created_at).toDateString() === new Date().toDateString()
                ).reduce((sum: number, d: any) => sum + Number(d.delivery_fee || 100), 0) || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riderProfile?.rating?.toFixed(1) || "5.0"} ★</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Deliveries */}
          <Card>
            <CardHeader>
              <CardTitle>My Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-12">
                  <Bike className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active deliveries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeDeliveries.map((order: any) => (
                    <div
                      key={order.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsFlowOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{order.profiles?.full_name || "Customer"}</p>
                          <p className="text-sm text-muted-foreground">{order.vendors?.name || "Vendor"}</p>
                        </div>
                        <Badge>{order.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{order.delivery_location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Available Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {availableOrders?.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">
                  No orders available at the moment
                </p>
              ) : (
                <div className="space-y-4">
                  {availableOrders?.map((order: any) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{order.vendors?.name || "Vendor"}</p>
                          <p className="text-sm text-muted-foreground">{order.vendors?.location || "Campus"}</p>
                        </div>
                        <Badge>₦{order.total_amount}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{order.delivery_location}</span>
                      </div>
                      <p className="text-sm font-medium text-primary mb-3">
                        ₦{order.delivery_fee || 100} delivery fee
                      </p>
                      <Button
                        onClick={() => acceptDelivery.mutate(order.id)}
                        disabled={acceptDelivery.isPending}
                        className="w-full"
                      >
                        Accept Delivery
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {selectedOrder && (
        <DeliveryFlow
          order={selectedOrder}
          isOpen={isFlowOpen}
          onClose={() => {
            setIsFlowOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}

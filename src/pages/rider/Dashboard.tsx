import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Bike, DollarSign, MapPin, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const acceptDelivery = async (orderId: string) => {
    if (!riderProfile) return;

    const { error } = await supabase
      .from("orders")
      .update({
        rider_id: riderProfile.user_id,
        status: "assigned",
      })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Delivery accepted" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Rider Dashboard</h1>
            <Button
              variant="ghost"
              onClick={() => supabase.auth.signOut().then(() => navigate("/"))}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myDeliveries?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riderProfile?.total_deliveries || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riderProfile?.rating?.toFixed(1) || "N/A"}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {availableOrders?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No available deliveries</p>
              ) : (
                <div className="space-y-4">
                  {availableOrders?.map((order: any) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{order.vendors.name}</p>
                          <p className="text-sm text-muted-foreground">{order.vendors.location}</p>
                        </div>
                        <Badge>₦{order.total_amount}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{order.delivery_location}</span>
                      </div>
                      <Button onClick={() => acceptDelivery(order.id)} className="w-full">
                        Accept Delivery
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {myDeliveries?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active deliveries</p>
              ) : (
                <div className="space-y-4">
                  {myDeliveries?.map((order: any) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{order.profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">{order.vendors.name}</p>
                        </div>
                        <Badge>{order.status}</Badge>
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
        </div>
      </main>
    </div>
  );
}

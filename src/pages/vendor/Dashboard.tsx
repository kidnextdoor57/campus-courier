import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, DollarSign, Clock, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: vendor } = useQuery({
    queryKey: ["my-vendor"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["vendor-orders", vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (quantity, unit_price),
          profiles:customer_id (full_name)
        `)
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendor,
  });

  const pendingOrders = orders?.filter((o) => ["pending", "confirmed"].includes(o.status)) || [];
  const todayRevenue = orders
    ?.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{vendor?.name || "Vendor Dashboard"}</h1>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate("/vendor/menu")}>
                Menu
              </Button>
              <Button variant="ghost" onClick={() => navigate("/vendor/orders")}>
                Orders
              </Button>
              <Button
                variant="ghost"
                onClick={() => supabase.auth.signOut().then(() => navigate("/"))}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{todayRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending orders</p>
            ) : (
              <div className="space-y-4">
                {pendingOrders.slice(0, 5).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{order.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items.length} items • ₦{order.total_amount}
                      </p>
                    </div>
                    <Badge>{order.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

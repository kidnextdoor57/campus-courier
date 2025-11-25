import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, Truck } from "lucide-react";
import { useEffect, useState } from "react";

export default function Orders() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          vendors:vendor_id (name, location),
          order_items (
            quantity,
            unit_price,
            menu_items:menu_item_id (name)
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Real-time subscription for order updates
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const channel = supabase
        .channel("student-orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `customer_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [queryClient]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_transit": return <Truck className="h-5 w-5 text-blue-500" />;
      default: return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "default";
      case "cancelled": return "destructive";
      case "in_transit": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/student/browse")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {isLoading ? (
          <div className="text-center py-12">Loading orders...</div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Button onClick={() => navigate("/student/browse")}>Start Ordering</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.vendors.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Order Date</span>
                      <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Location</span>
                      <span>{order.delivery_location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span>{order.order_items.length} items</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>₦{order.total_amount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

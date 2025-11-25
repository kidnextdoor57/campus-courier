import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function VendorOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: vendor } = useQuery({
    queryKey: ["vendor-profile"],
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

  const { data: orders, isLoading } = useQuery({
    queryKey: ["vendor-orders", vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles:customer_id (full_name, phone),
          order_items (
            quantity,
            unit_price,
            menu_items:menu_item_id (name)
          )
        `)
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendor?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!vendor?.id) return;

    const channel = supabase
      .channel("vendor-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `vendor_id=eq.${vendor.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendor?.id, queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      toast({ title: "Order status updated successfully!" });
    },
  });

  const getNextStatus = (currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
    };
    return statusFlow[currentStatus];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "secondary",
      confirmed: "default",
      preparing: "default",
      ready: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    return colors[status] || "secondary";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/vendor/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Order Management</h1>

        {isLoading ? (
          <div className="text-center py-12">Loading orders...</div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge variant={getStatusColor(order.status) as any}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <p className="font-medium">{order.profiles?.full_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium">{order.profiles?.phone || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivery Location:</span>
                        <p className="font-medium">{order.delivery_location}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Order Time:</span>
                        <p className="font-medium">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Items:</p>
                      <div className="space-y-1">
                        {order.order_items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.menu_items.name}
                            </span>
                            <span className="font-medium">₦{item.unit_price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="font-semibold text-lg">
                        Total: ₦{order.total_amount}
                      </div>
                      {getNextStatus(order.status) && (
                        <Button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              orderId: order.id,
                              status: getNextStatus(order.status),
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as {getNextStatus(order.status).replace("_", " ")}
                        </Button>
                      )}
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

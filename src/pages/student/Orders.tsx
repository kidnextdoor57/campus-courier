import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, Truck, UtensilsCrossed, ChefHat } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

export default function Orders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries (Kept logic, improved UI)
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("orders")
        .select(`*, vendors:vendor_id (name, location), order_items (quantity, unit_price, menu_items:menu_item_id (name))`)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Real-time subscription (Critical for student experience)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const channel = supabase.channel("student-orders")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["my-orders"] }))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    });
  }, [queryClient]);

  // Visual Stepper Logic
  const getProgress = (status: string) => {
    switch (status) {
      case "pending": return 10;
      case "accepted": return 30;
      case "preparing": return 60;
      case "in_transit": return 85;
      case "delivered": return 100;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "delivered") return "bg-green-500";
    if (status === "cancelled") return "bg-red-500";
    return "bg-primary";
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/student/browse")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
             {[1,2].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-20 bg-background rounded-xl border border-dashed">
            <UtensilsCrossed className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No past orders</h3>
            <Button onClick={() => navigate("/student/browse")}>Start Ordering</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders?.map((order: any) => {
              const progress = getProgress(order.status);
              const isRecent = new Date().getTime() - new Date(order.created_at).getTime() < 86400000; // 24 hours

              return (
                <Card key={order.id} className={`overflow-hidden ${isRecent ? 'border-primary/50 shadow-md' : 'opacity-90'}`}>
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{order.vendors.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    {/* Visual Tracker for Active Orders */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                       <div className="mb-6 space-y-2">
                          <div className="flex justify-between text-xs font-medium text-muted-foreground">
                             <span className={order.status === 'pending' ? 'text-primary' : ''}>Placed</span>
                             <span className={order.status === 'preparing' ? 'text-primary' : ''}>Preparing</span>
                             <span className={order.status === 'in_transit' ? 'text-primary' : ''}>On way</span>
                             <span>Delivered</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                       </div>
                    )}

                    <div className="space-y-1">
                      {order.order_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.quantity}x {item.menu_items.name}</span>
                          <span>₦{item.unit_price * item.quantity}</span>
                        </div>
                      ))}
                    </div>                    <div className="mt-4 pt-4 border-t flex justify-between font-bold">
                       <span>Total</span>
                       <span>₦{order.total_amount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                  {order.status === 'delivered' && (
                     <CardFooter className="bg-muted/10">
                        <Button variant="outline" className="w-full text-xs h-8" size="sm">
                           Rate Order
                        </Button>
                        <Button className="w-full ml-2 text-xs h-8" size="sm" onClick={() => navigate(`/student/vendor/${order.vendor_id}`)}>
                           Reorder
                        </Button>
                     </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
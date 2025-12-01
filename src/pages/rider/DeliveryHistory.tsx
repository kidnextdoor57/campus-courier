import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardNav } from "@/components/DashboardNav";
import { Search, MapPin, Calendar, Package } from "lucide-react";

interface OrderHistory {
  id: string;
  status: string;
  delivery_location: string;
  created_at: string;
  delivery_fee: number;
  vendors?: { name: string };
  profiles?: { full_name: string };
  customer?: { full_name: string };
}

export default function DeliveryHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const { data: history } = useQuery<OrderHistory[]>({
    queryKey: ["rider-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          delivery_location,
          created_at,
          delivery_fee,
          customer_id,
          vendors (name)
        `)
        .eq("rider_id", user.id)
        .in("status", ["delivered", "cancelled"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch customer names separately
      const ordersWithCustomers = await Promise.all(
        data.map(async (order) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", order.customer_id)
            .single();
          
          return {
            ...order,
            profiles: profile ? { full_name: profile.full_name } : undefined
          };
        })
      );
      
      return ordersWithCustomers as OrderHistory[];
    },
  });

  const filteredHistory = history?.filter(order => 
    order.vendors?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.delivery_location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userEmail={userEmail} userRole="rider" menuItems={[
        { label: "Dashboard", href: "/rider/dashboard", icon: <Package className="h-4 w-4" /> }
      ]} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Delivery History</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredHistory?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No history found.</div>
          ) : (
            filteredHistory?.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{order.vendors?.name}</h3>
                      <p className="text-sm text-muted-foreground">To: {order.profiles?.full_name}</p>
                    </div>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'destructive'}>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {order.delivery_location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Order ID: #{order.id.slice(0, 8)}</span>
                    <span className="font-bold text-primary">Earned: ₦{order.delivery_fee}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
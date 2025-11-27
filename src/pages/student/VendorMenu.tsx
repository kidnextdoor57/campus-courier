import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowLeft, Plus, Minus, Star, Info, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function VendorMenu() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Queries (Kept same logic, just cleaner)
  const { data: vendor } = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").eq("id", vendorId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: menuItems } = useQuery({
    queryKey: ["menu-items", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").eq("vendor_id", vendorId).eq("is_available", true);
      if (error) throw error;
      return data;
    },
  });

  // Cart Logic
  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    toast({ title: "Added to basket", description: `${item.name} has been added.` });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((i) => i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i);
      return updated.filter((i) => i.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Banner Image */}
      <div className="relative h-48 md:h-64 bg-muted">
         {vendor?.image_url && (
            <img src={vendor.image_url} alt={vendor.name} className="w-full h-full object-cover" />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
         <Button 
            variant="secondary" 
            size="icon" 
            className="absolute top-4 left-4 rounded-full shadow-lg"
            onClick={() => navigate("/student/browse")}
         >
            <ArrowLeft className="h-4 w-4" />
         </Button>
      </div>

      <main className="container mx-auto px-4 -mt-12 relative z-10">
        {/* Vendor Info Card */}
        {vendor && (
          <Card className="mb-8 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                   <h1 className="text-3xl font-bold mb-2">{vendor.name}</h1>
                   <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">{vendor.rating?.toFixed(1)} (100+)</span>
                      <span>•</span>
                      <span>{vendor.location}</span>
                   </div>
                   <p className="text-muted-foreground">{vendor.description}</p>
                </div>
                <Badge variant={vendor.is_active ? "default" : "destructive"}>
                   {vendor.is_active ? "Open Now" : "Closed"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="h-5 w-5" /> Menu Items
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {menuItems?.map((item) => {
              const cartItem = cart.find((i) => i.id === item.id);
              return (
                <Card key={item.id} className="overflow-hidden border shadow-sm hover:border-primary/50 transition-colors flex flex-row h-32">
                  <div className="w-32 h-32 bg-muted shrink-0">
                     {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                           <Utensils className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                     )}
                  </div>
                  <CardContent className="p-4 flex flex-col justify-between flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                      <span className="font-semibold text-primary shrink-0">₦{item.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>                    <div className="flex justify-end mt-2">
                      {cartItem ? (
                        <div className="flex items-center bg-secondary rounded-lg p-1 gap-3">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            title={`Decrease quantity of ${item.name}`}
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-background rounded-md transition-colors"
                          >
                             <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold w-4 text-center">{cartItem.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            title={`Increase quantity of ${item.name}`}
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-background rounded-md transition-colors"
                          >
                             <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => addToCart(item)} className="h-8">
                          Add
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      {/* Floating Cart Bar (Mobile/Desktop) */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50">
          <Button 
            size="lg" 
            className="w-full max-w-2xl shadow-xl animate-in slide-in-from-bottom-5 bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-xl"
            onClick={() => navigate("/student/cart", { state: { cart, vendor } })}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="bg-primary-foreground/20 px-2 py-1 rounded text-sm font-bold">
                  {cartCount}
                </div>
                <span>View Basket</span>
              </div>
              <span className="font-bold text-lg">₦{cartTotal.toFixed(2)}</span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}
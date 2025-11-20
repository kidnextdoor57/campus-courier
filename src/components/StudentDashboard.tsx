import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, MapPin, Clock, Star } from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
  description: string;
  image_url: string;
  location: string;
  rating: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  is_available: boolean;
  prep_time: number;
  vendor_id: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export const StudentDashboard = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      fetchMenuItems(selectedVendor);
    }
  }, [selectedVendor]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async (vendorId: string) => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("is_available", true);

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      toast.error("Failed to load menu items");
    }
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      setCart(cart.map((i) => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success("Added to cart");
  };

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Order Food
          </h1>
          <p className="text-muted-foreground">Fresh meals delivered to your location</p>
        </div>
        <div className="relative">
          <Button variant="outline" className="relative">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Cart
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0">
                {cart.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vendors Grid */}
      {!selectedVendor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <Card
              key={vendor.id}
              className="cursor-pointer hover:shadow-custom-md transition-all hover:-translate-y-1"
              onClick={() => setSelectedVendor(vendor.id)}
            >
              <CardHeader className="p-0">
                <div className="h-48 bg-gradient-primary rounded-t-lg flex items-center justify-center">
                  <span className="text-6xl">🍽️</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{vendor.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="text-sm font-medium">{vendor.rating}</span>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {vendor.description}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {vendor.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    15-20 min
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setSelectedVendor(null)}>
            ← Back to Vendors
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-custom-md transition-all">
                <div className="h-40 bg-gradient-secondary flex items-center justify-center">
                  <span className="text-5xl">🍕</span>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      ₦{item.price.toFixed(2)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.prep_time} mins
                    </Badge>
                  </div>
                  <Button onClick={() => addToCart(item)} className="w-full">
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="fixed bottom-6 right-6 w-80 shadow-custom-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Cart Summary</span>
              <ShoppingCart className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span className="font-medium">₦{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">₦{cartTotal.toFixed(2)}</span>
            </div>
            <Button className="w-full">Proceed to Checkout</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
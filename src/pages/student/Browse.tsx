import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { DashboardNav } from "@/components/DashboardNav";
import { Star, Search, MapPin, Store, Clock, Utensils, ShoppingCart, Package, UserCircle } from "lucide-react";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const { data: vendors, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const filteredVendors = vendors?.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const menuItems = [
    { label: "Browse", href: "/student/browse", icon: <Store className="h-4 w-4" /> },
    { label: "Cart", href: "/student/cart", icon: <ShoppingCart className="h-4 w-4" /> },
    { label: "Orders", href: "/student/orders", icon: <Package className="h-4 w-4" /> },
    { label: "Profile", href: "/student/profile", icon: <UserCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardNav userEmail={userEmail} userRole="student" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Utensils className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Browse Campus Vendors</h1>
          <p className="text-muted-foreground text-lg">Discover delicious meals from your favorite campus restaurants</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded mb-4" />
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-16" />
                    <div className="h-10 bg-muted rounded w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVendors?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Store className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Vendors Found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchQuery ? "Try adjusting your search" : "Check back later! New vendors are being added all the time."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Vendors</p>
                    <p className="text-2xl font-bold">{filteredVendors?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Delivery</p>
                    <p className="text-2xl font-bold">15-20 min</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-accent fill-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top Rated</p>
                    <p className="text-2xl font-bold">4.8★</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vendors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors?.map((vendor) => (
                <Card 
                  key={vendor.id} 
                  className="group hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border-2"
                  onClick={() => navigate(`/student/vendor/${vendor.id}`)}
                >
                  <CardHeader className="p-0">
                    {vendor.image_url ? (
                      <img
                        src={vendor.image_url}
                        alt={vendor.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center">
                        <Store className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors mb-2">
                        {vendor.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {vendor.description || "Fresh and delicious campus food delivered to your location"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{vendor.location}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-medium">{vendor.rating?.toFixed(1) || "4.5"}</span>
                        </div>
                        <Badge variant="secondary">Open</Badge>
                      </div>
                    </div>

                    <Button className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/vendor/${vendor.id}`);
                    }}>
                      View Menu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

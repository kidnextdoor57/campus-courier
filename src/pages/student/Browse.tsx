import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { DashboardNav } from "@/components/DashboardNav";
import { Star, Search, MapPin, Store, Clock, Utensils,ShoppingCart, Package, UserCircle, Heart, Filter} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [userEmail, setUserEmail] = useState<string>("");
  const navigate = useNavigate();

  // Mock Categories for filtering
  const categories = ["All", "Fast Food", "Traditional", "Drinks", "Snacks"];

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

  const filteredVendors = vendors?.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
    // In a real app, you'd check vendor.category === selectedCategory
    const matchesCategory = selectedCategory === "All" || true;
    return matchesSearch && matchesCategory;
  });

  const menuItems = [
    { label: "Browse", href: "/student/browse", icon: <Store className="h-4 w-4" /> },
    { label: "Cart", href: "/student/cart", icon: <ShoppingCart className="h-4 w-4" /> },
    { label: "Orders", href: "/student/orders", icon: <Package className="h-4 w-4" /> },
    { label: "Profile", href: "/student/profile", icon: <UserCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userEmail={userEmail} userRole="student" menuItems={menuItems} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Good Afternoon, Scholar 👋</h1>
          <p className="text-muted-foreground">What are you craving today?</p>
                    {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search restaurants or food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background shadow-sm"
              />
            </div>
            <Button variant="outline" className="h-12 px-6 gap-2 hidden md:flex">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>

          {/* Categories Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full px-6"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Vendors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse border-none shadow-sm">
                <div className="h-48 bg-muted rounded-t-xl" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVendors?.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No restaurants found</h3>
            <p className="text-muted-foreground">Try changing your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors?.map((vendor) => (
              <Card
                key={vendor.id}
                className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden rounded-xl"
                onClick={() => navigate(`/student/vendor/${vendor.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={vendor.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                    alt={vendor.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-red-500" onClick={(e) => { e.stopPropagation(); /* Add favorite logic */ }}>
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end text-white">
                    <div>
                      <h3 className="font-bold text-lg">{vendor.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-white/90">
                        <Clock className="h-3 w-3" /> 15-25 min • <span className="font-medium">Free Delivery</span>
                      </div>
                    </div>
                    <Badge className="bg-white/90 text-black hover:bg-white border-none flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {vendor.rating?.toFixed(1) || "New"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                   <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {vendor.description || "Tasty meals available."}
                  </p>
                  <Separator className="mb-3" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {vendor.location}
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
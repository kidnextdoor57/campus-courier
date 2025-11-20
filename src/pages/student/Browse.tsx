import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Star, Search, MapPin } from "lucide-react";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">CampusEats</h1>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate("/student/orders")}>
                Orders
              </Button>
              <Button variant="ghost" onClick={() => navigate("/student/profile")}>
                Profile
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">Loading vendors...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors?.map((vendor) => (
              <Card
                key={vendor.id}
                className="cursor-pointer hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
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
                    <div className="w-full h-48 bg-gradient-primary rounded-t-lg" />
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="mb-2">{vendor.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-3">
                    {vendor.description || "Delicious food awaits!"}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{vendor.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span>{vendor.rating || "New"}</span>
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

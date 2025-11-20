import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { StudentDashboard } from "@/components/StudentDashboard";
import { 
  Utensils, 
  Clock, 
  MapPin, 
  Shield, 
  Smartphone, 
  TrendingUp,
  User,
  LogOut
} from "lucide-react";
import heroImage from "@/assets/hero-campus-delivery.jpg";
import foodImage from "@/assets/food-variety.jpg";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserRole(session.user.id);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      
      if (error) throw error;
      setUserRole(data?.role || null);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <nav className="border-b bg-card shadow-custom-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Utensils className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">CFDS</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user.email}</span>
                <Badge variant="secondary">{userRole}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        {userRole === "student" && <StudentDashboard />}
        {userRole === "vendor" && (
          <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground">Manage your menu and orders</p>
          </div>
        )}
        {userRole === "rider" && (
          <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold">Rider Dashboard</h1>
            <p className="text-muted-foreground">View and manage deliveries</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        <div className="container relative mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
                <Utensils className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Campus Food,
              <br />
              <span className="text-accent">Delivered Fast</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Order from your favorite campus vendors and get your meal delivered
              to your exact location in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6 shadow-custom-lg hover:shadow-glow transition-all"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-primary">CFDS</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The smartest way to enjoy campus dining
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "Lightning Fast",
                description: "Get your food in 15-20 minutes. No more long queues or waiting times."
              },
              {
                icon: Smartphone,
                title: "Easy Ordering",
                description: "Browse menus, customize orders, and track delivery all in one place."
              },
              {
                icon: MapPin,
                title: "Real-time Tracking",
                description: "Know exactly where your food is with live GPS tracking."
              },
              {
                icon: Shield,
                title: "Secure Payments",
                description: "Safe and secure digital payments with multiple options."
              },
              {
                icon: TrendingUp,
                title: "Best Prices",
                description: "Competitive prices with regular deals and student discounts."
              },
              {
                icon: Utensils,
                title: "Wide Selection",
                description: "Choose from all your favorite campus vendors in one app."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card p-8 rounded-2xl shadow-custom-md hover:shadow-custom-lg transition-all hover:-translate-y-1"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-primary flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It <span className="text-secondary">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ordering food has never been easier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Browse", desc: "Explore menus from campus vendors" },
              { step: "2", title: "Order", desc: "Add items to cart and checkout" },
              { step: "3", title: "Track", desc: "Watch your order in real-time" },
              { step: "4", title: "Enjoy", desc: "Receive and enjoy your meal" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-secondary mx-auto mb-4 flex items-center justify-center shadow-custom-md">
                  <span className="text-3xl font-bold text-secondary-foreground">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${foodImage})` }}
        />
        <div className="container relative mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Start Ordering?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of students already enjoying fast, convenient campus food delivery
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-10 py-6 shadow-custom-lg hover:shadow-glow transition-all"
          >
            Sign Up Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <Utensils className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Campus Food Delivery System</span>
          </div>
          <p>© 2025 CFDS. All rights reserved.</p>
          <p className="text-sm mt-2">Babcock University</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { Badge } from "@/components/ui/badge";
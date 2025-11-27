import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Utensils, User, LogOut, Menu as MenuIcon, Bell, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DashboardNavProps {
  userEmail?: string;
  userRole?: string | null;
  menuItems?: Array<{ label: string; href: string; icon?: React.ReactNode }>;
}

export function DashboardNav({ userEmail, userRole, menuItems = [] }: DashboardNavProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Utensils className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-none tracking-tight">CFDS</h1>
              {userRole && (
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {userRole} Portal
                </span>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.href)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </Button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wallet (Feature Addition) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-secondary">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">₦2,500.00</span>
            </div>

            {/* Notifications (Feature Addition) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                </div>
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              </PopoverContent>
            </Popover>

            {/* Mobile Menu Trigger */}
            {menuItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel>Menu</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {menuItems.map((item, index) => (
                    <DropdownMenuItem key={index} onClick={() => navigate(item.href)}>
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-muted/50">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {userEmail && (
                      <p className="font-medium text-sm truncate w-48">{userEmail}</p>
                    )}
                    {userRole && (
                      <p className="w-full text-xs text-muted-foreground capitalize">
                        {userRole}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/student/profile')}>
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
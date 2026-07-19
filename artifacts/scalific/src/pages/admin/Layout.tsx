"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FormInput, 
  Image as ImageIcon, 
  MessageSquare, 
  Quote,
  LogOut,
  Menu,
  Palette,
  Globe2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const logoPath = "/assets/scalific-logo.png";

const navItems = [
  { href: "/admin/services",     label: "Services",      icon: LayoutDashboard },
  { href: "/admin/team",         label: "Team",          icon: Users },
  { href: "/admin/content",      label: "Content",       icon: FileText },
  { href: "/admin/testimonials", label: "Testimonials",  icon: Quote },
  { href: "/admin/contact-form", label: "Contact Form",  icon: FormInput },
  { href: "/admin/branding",     label: "Branding",      icon: ImageIcon },
  { href: "/admin/seo-geo",      label: "SEO & GEO",     icon: Globe2 },
  { href: "/admin/colors",       label: "Colors",        icon: Palette },
  { href: "/admin/submissions",  label: "Submissions",   icon: MessageSquare },
  { href: "/admin/setup",        label: "DB Setup",      icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email || null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col space-y-2 w-full">
      {navItems.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        const Icon = item.icon;
        
        return (
          <Link key={item.href} href={item.href}>
            <span
              onClick={onClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive 
                  ? "bg-primary/20 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground font-sans selection:bg-primary/30">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <img src={logoPath} alt="Scalific" className="h-6 w-auto" />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card border-r border-border p-0 flex flex-col">
            <div className="p-6 border-b border-border">
              <img src={logoPath} alt="Scalific" className="h-8 w-auto" />
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <NavLinks onClick={() => document.body.click()} />
            </div>
            <div className="p-4 border-t border-border space-y-4 bg-muted/20">
              <div className="text-xs text-muted-foreground truncate px-2">
                {userEmail}
              </div>
              <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-72 bg-card border-r border-border min-h-screen fixed left-0 top-0">
        <div className="p-8 border-b border-border h-[88px] flex items-center">
          <img src={logoPath} alt="Scalific" className="h-8 w-auto" />
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-6 border-t border-border space-y-4 bg-muted/20">
          <div className="text-xs font-mono text-muted-foreground truncate px-2" title={userEmail || ""}>
            {userEmail}
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        <main className="flex-1 p-6 md:p-10 lg:p-12 relative z-10 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

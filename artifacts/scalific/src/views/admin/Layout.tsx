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
  Activity,
  ShieldCheck,
  History,
  KeyRound,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

import { applyBrandColor } from "@/lib/brandColor";

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
  { href: "/admin/employees",    label: "Employees",     icon: ShieldCheck },
  { href: "/admin/tracking",     label: "Tracking",      icon: Activity },
  { href: "/admin/activity",     label: "Activity Logs", icon: History },
  { href: "/admin/security",     label: "2FA Security",  icon: KeyRound },
  { href: "/admin/setup",        label: "DB Setup",      icon: Settings },
];

type PermissionRequest = {
  id: string;
  requested_by: string;
  request_type: "CREATE" | "UPDATE" | "DELETE";
  target_email: string;
  payload: any;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [allowedSections, setAllowedSections] = useState<string[] | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PermissionRequest[]>([]);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    const { data } = await supabase
      .from("permission_requests")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    setPendingRequests((data as PermissionRequest[]) || []);
  };

  useEffect(() => {
    if (allowedSections === null) {
      fetchPendingRequests();
      const interval = setInterval(fetchPendingRequests, 8000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [allowedSections]);

  const handleApproveRequest = async (req: PermissionRequest) => {
    setProcessingReqId(req.id);
    let error = null;

    if (req.request_type === "DELETE") {
      const res = await supabase.from("employee_permissions").delete().eq("user_email", req.target_email);
      error = res.error;
    } else {
      const payload = req.payload;
      const cleanPayload = {
        user_email: payload.user_email,
        role_title: payload.role_title,
        is_super_admin: payload.is_super_admin,
        allowed_sections: payload.allowed_sections,
      };

      const res = await supabase.from("employee_permissions").upsert(cleanPayload, { onConflict: "user_email" });
      error = res.error;
    }

    if (!error) {
      await supabase.from("permission_requests").update({ status: "APPROVED" }).eq("id", req.id);
      toast.success(`Request approved and applied for ${req.target_email}`);
      await logActivity("UPDATE", "Employees", `Super Admin APPROVED request for ${req.target_email}`);
      fetchPendingRequests();
    } else {
      toast.error(`Failed to approve: ${error.message}`);
    }
    setProcessingReqId(null);
  };

  const handleRejectRequest = async (req: PermissionRequest) => {
    setProcessingReqId(req.id);
    await supabase.from("permission_requests").update({ status: "REJECTED" }).eq("id", req.id);
    setProcessingReqId(null);
    toast.info(`Request for ${req.target_email} rejected`);
    fetchPendingRequests();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email || null;
      setUserEmail(email);

      if (email) {
        supabase
          .from("employee_permissions")
          .select("*")
          .eq("user_email", email.toLowerCase())
          .maybeSingle()
          .then(({ data: permData }) => {
            if (permData) {
              if (permData.is_super_admin) {
                setAllowedSections(null);
              } else if (Array.isArray(permData.allowed_sections)) {
                setAllowedSections(permData.allowed_sections);
              }
            } else {
              setAllowedSections(null);
            }
          });
      }
    });

    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "color_primary")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          applyBrandColor(data.value);
        }
      });
  }, []);

  useEffect(() => {
    if (allowedSections !== null && pathname) {
      const isAllowed = allowedSections.some((href) => pathname.startsWith(href));
      if (!isAllowed && allowedSections.length > 0) {
        router.push(allowedSections[0]);
      }
    }
  }, [allowedSections, pathname, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const visibleNavItems = navItems.filter((item) => {
    if (!allowedSections) return true;
    return allowedSections.includes(item.href);
  });

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col space-y-2 w-full">
      {visibleNavItems.map((item) => {
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
          {allowedSections === null && (
            <button
              onClick={() => setRequestModalOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors text-xs font-medium"
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span>Pending Approvals</span>
              </span>
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          <div className="text-xs font-mono text-muted-foreground truncate px-2" title={userEmail || ""}>
            {userEmail}
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex h-[88px] border-b border-border bg-card/50 backdrop-blur items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Portal</span>
            {allowedSections === null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Profile
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {allowedSections === null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestModalOpen(true)}
                className="relative gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 text-xs font-semibold"
              >
                <Bell className="w-4 h-4" />
                <span>Pending Employee Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </Button>
            )}

            <div className="text-xs font-medium text-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
              {userEmail}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>

      {/* Super Admin Pending Requests Dialog */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Super Admin Pending Approval Requests ({pendingRequests.length})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-3 max-h-[420px] overflow-y-auto">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-medium text-foreground">All caught up!</p>
                <p className="text-xs">There are no pending employee permission requests right now.</p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-muted/30 border border-border rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{req.target_email}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                        {req.request_type}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Requested by: <strong>{req.requested_by}</strong> • Role: <strong>{req.payload?.role_title || "Employee"}</strong>
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(req)}
                      disabled={processingReqId === req.id}
                      className="text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 h-8"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(req)}
                      disabled={processingReqId === req.id}
                      className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                    >
                      {processingReqId === req.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Approve & Apply
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

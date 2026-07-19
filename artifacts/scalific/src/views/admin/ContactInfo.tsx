"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PhoneCall, Mail, MapPin, MessageCircle, Save, Loader2, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";
import { logActivity } from "@/lib/logger";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminContactInfo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    contact_phone: "+91 98765 43210",
    contact_email: "hello@scalific.in",
    contact_location: "Remote-first, serving clients worldwide.",
    whatsapp_number: "+91 98765 43210",
    whatsapp_message: "Hello Scalific team, I would like to inquire about your services!",
  });

  const fetchContactInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content_blocks")
        .select("section_key, content")
        .in("section_key", [
          "contact_phone",
          "contact_email",
          "contact_location",
          "whatsapp_number",
          "whatsapp_message",
        ]);

      if (!error && data) {
        const map = Object.fromEntries(data.map((item) => [item.section_key, item.content]));
        setForm({
          contact_phone: map.contact_phone || "+91 98765 43210",
          contact_email: map.contact_email || "hello@scalific.in",
          contact_location: map.contact_location || "Remote-first, serving clients worldwide.",
          whatsapp_number: map.whatsapp_number || map.contact_phone || "+91 98765 43210",
          whatsapp_message: map.whatsapp_message || "Hello Scalific team, I would like to inquire about your services!",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load contact information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const itemsToUpsert = [
      { section_key: "contact_phone", content: form.contact_phone, updated_at: new Date().toISOString() },
      { section_key: "contact_email", content: form.contact_email, updated_at: new Date().toISOString() },
      { section_key: "contact_location", content: form.contact_location, updated_at: new Date().toISOString() },
      { section_key: "whatsapp_number", content: form.whatsapp_number, updated_at: new Date().toISOString() },
      { section_key: "whatsapp_message", content: form.whatsapp_message, updated_at: new Date().toISOString() },
    ];

    const { error } = await supabase.from("content_blocks").upsert(itemsToUpsert, { onConflict: "section_key" });

    setSaving(false);

    if (error) {
      toast.error(`Failed to save contact info: ${error.message}`);
    } else {
      toast.success("Contact information updated successfully!");
      await logActivity("UPDATE", "Contact Info", "Updated call number, email, address, and WhatsApp details");
    }
  };

  const cleanWhatsappNum = form.whatsapp_number.replace(/[^\d]/g, "");
  const whatsappPreviewUrl = `https://wa.me/${cleanWhatsappNum}?text=${encodeURIComponent(form.whatsapp_message)}`;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Contact Information</h1>
          <p className="text-muted-foreground mt-1">
            Manage call phone numbers, email address, physical location, and WhatsApp quick-chat configuration.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchContactInfo} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Main Contact Channels Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-3">
              <PhoneCall className="w-5 h-5 text-primary" />
              Direct Communication Channels
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone / Call Number */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-primary" />
                  Call Phone Number
                </label>
                <Input
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                  className="bg-background/50"
                />
                <p className="text-[11px] text-muted-foreground">Displayed in the header, contact section, and call CTA buttons.</p>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Official Email Address
                </label>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="hello@scalific.in"
                  required
                  className="bg-background/50"
                />
                <p className="text-[11px] text-muted-foreground">Used for client inquiries, contact form delivery, and footer.</p>
              </div>
            </div>

            {/* Address / Location */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Office Address / Location
              </label>
              <Textarea
                value={form.contact_location}
                onChange={(e) => setForm({ ...form, contact_location: e.target.value })}
                placeholder="e.g. 123 Innovation Way, Tech Park, City / Remote-first, serving clients worldwide."
                rows={2}
                required
                className="bg-background/50"
              />
              <p className="text-[11px] text-muted-foreground">Displayed on the Contact section and main footer.</p>
            </div>
          </div>

          {/* WhatsApp Floating Button Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-3">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              WhatsApp Floating Chat & Prefilled Message
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WhatsApp Phone Number */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                  WhatsApp Phone Number (with Country Code)
                </label>
                <Input
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  placeholder="+91 98765 43210 or 919876543210"
                  required
                  className="bg-background/50 font-mono"
                />
                <p className="text-[11px] text-muted-foreground">Must include country code (e.g. +91 for India, +1 for US).</p>
              </div>

              {/* Live Test Link */}
              <div className="space-y-2 flex flex-col justify-end">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Test Live WhatsApp Link
                </label>
                <a
                  href={whatsappPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 font-semibold text-xs transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Test WhatsApp Chat Button
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>

            {/* WhatsApp Prefilled Message */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Prefilled WhatsApp Greeting Message
              </label>
              <Textarea
                value={form.whatsapp_message}
                onChange={(e) => setForm({ ...form, whatsapp_message: e.target.value })}
                placeholder="e.g. Hello Scalific team, I would like to inquire about your services!"
                rows={3}
                required
                className="bg-background/50"
              />
              <p className="text-[11px] text-muted-foreground">
                This text will be pre-filled automatically in the user's WhatsApp chat when they click the WhatsApp button on your website.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3">
            <Button type="submit" disabled={saving} size="lg" className="gap-2 min-w-[160px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving Changes..." : "Save Contact Info"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

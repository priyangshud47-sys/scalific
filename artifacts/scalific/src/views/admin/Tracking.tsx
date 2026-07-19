"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Loader2, BarChart3, Activity, ShieldCheck, Key, Eye, EyeOff, Globe } from "lucide-react";
import { logActivity } from "@/lib/logger";

export default function AdminTracking() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFbToken, setShowFbToken] = useState(false);

  const [settings, setSettings] = useState({
    fb_pixel_id: "",
    fb_conversions_api_token: "",
    fb_test_event_code: "",
    ga4_measurement_id: "",
    gtm_container_id: "",
  });

  const fetchTrackingSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "fb_pixel_id",
        "fb_conversions_api_token",
        "fb_test_event_code",
        "ga4_measurement_id",
        "gtm_container_id",
      ]);

    if (!error && data) {
      const map = Object.fromEntries(data.map((d) => [d.key, d.value || ""]));
      setSettings({
        fb_pixel_id: map.fb_pixel_id || "",
        fb_conversions_api_token: map.fb_conversions_api_token || "",
        fb_test_event_code: map.fb_test_event_code || "",
        ga4_measurement_id: map.ga4_measurement_id || "",
        gtm_container_id: map.gtm_container_id || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrackingSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const updates = [
      { key: "fb_pixel_id", value: settings.fb_pixel_id },
      { key: "fb_conversions_api_token", value: settings.fb_conversions_api_token },
      { key: "fb_test_event_code", value: settings.fb_test_event_code },
      { key: "ga4_measurement_id", value: settings.ga4_measurement_id },
      { key: "gtm_container_id", value: settings.gtm_container_id },
    ];

    const { error } = await supabase.from("site_settings").upsert(updates, { onConflict: "key" });
    setSaving(false);

    if (error) {
      toast.error(`Failed to save tracking settings: ${error.message}`);
    } else {
      toast.success("Tracking & Pixel integrations updated successfully");
      await logActivity("UPDATE", "Tracking", "Updated Facebook CAPI, GA4, and GTM IDs");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-display font-bold tracking-tight">Tracking & Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Configure Facebook Conversions API, Meta Pixel, Google Analytics 4, and Google Tag Manager.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className="gap-2 shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Integrations
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-48 bg-card border border-border rounded-xl animate-pulse" />
          <div className="h-48 bg-card border border-border rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Meta / Facebook Section */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  f
                </div>
                <div>
                  <h2 className="font-display font-semibold text-lg">Facebook / Meta Pixel & Conversions API (CAPI)</h2>
                  <p className="text-xs text-muted-foreground">Server-side and browser tracking for Facebook Ads</p>
                </div>
              </div>
              {settings.fb_pixel_id ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Meta Active
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pixel ID */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Facebook Pixel ID
                </label>
                <Input
                  value={settings.fb_pixel_id}
                  onChange={(e) => setSettings({ ...settings, fb_pixel_id: e.target.value })}
                  placeholder="e.g. 123456789012345"
                  className="font-mono text-xs bg-background/50"
                />
              </div>

              {/* Test Event Code */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Test Event Code (Optional)
                </label>
                <Input
                  value={settings.fb_test_event_code}
                  onChange={(e) => setSettings({ ...settings, fb_test_event_code: e.target.value })}
                  placeholder="e.g. TEST12345"
                  className="font-mono text-xs bg-background/50"
                />
              </div>
            </div>

            {/* Conversions API Token */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-primary" /> Conversions API Access Token (CAPI)</span>
                <button
                  type="button"
                  onClick={() => setShowFbToken(!showFbToken)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {showFbToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showFbToken ? "Hide Token" : "Show Token"}
                </button>
              </label>
              <Textarea
                rows={3}
                value={settings.fb_conversions_api_token}
                onChange={(e) => setSettings({ ...settings, fb_conversions_api_token: e.target.value })}
                placeholder="EAA..."
                className={`font-mono text-xs bg-background/50 ${!showFbToken ? "blur-[3px] focus:blur-none transition-all" : ""}`}
              />
            </div>
          </div>

          {/* Google Ecosystem Section */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  G
                </div>
                <div>
                  <h2 className="font-display font-semibold text-lg">Google Analytics 4 & Google Tag Manager</h2>
                  <p className="text-xs text-muted-foreground">Universal event measurement and tag orchestration</p>
                </div>
              </div>
              {settings.ga4_measurement_id || settings.gtm_container_id ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Google Active
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* GA4 ID */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" /> Google Analytics 4 (GA4) ID
                </label>
                <Input
                  value={settings.ga4_measurement_id}
                  onChange={(e) => setSettings({ ...settings, ga4_measurement_id: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="font-mono text-xs bg-background/50"
                />
              </div>

              {/* GTM Container ID */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Google Tag Manager (GTM) Container ID
                </label>
                <Input
                  value={settings.gtm_container_id}
                  onChange={(e) => setSettings({ ...settings, gtm_container_id: e.target.value })}
                  placeholder="GTM-XXXXXXX"
                  className="font-mono text-xs bg-background/50"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

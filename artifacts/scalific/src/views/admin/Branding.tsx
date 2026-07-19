"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";

const defaultHeaderLogoPath = "/assets/scalific-logo.png";
const defaultFooterLogoPath = "/assets/scalific-footer-logo.svg";
const defaultFaviconPath = "/favicon.svg";

type LogoSlot = "header" | "footer" | "favicon";

type LogoConfig = {
  bucketPrefix: string;
  description: string;
  defaultPath: string;
  key: string;
  previewLabel: string;
  title: string;
};

const logoConfigs: Record<LogoSlot, LogoConfig> = {
  header: {
    bucketPrefix: "header_logo",
    description: "Displayed in the main site header.",
    defaultPath: defaultHeaderLogoPath,
    key: "logo_url",
    previewLabel: "Preview on Light",
    title: "Header Logo",
  },
  footer: {
    bucketPrefix: "footer_logo",
    description: "Displayed in the public site footer.",
    defaultPath: defaultFooterLogoPath,
    key: "footer_logo_url",
    previewLabel: "Preview on Dark",
    title: "Footer Logo",
  },
  favicon: {
    bucketPrefix: "favicon",
    description: "Displayed in browser tabs, bookmarks, and search result previews.",
    defaultPath: defaultFaviconPath,
    key: "favicon_url",
    previewLabel: "Browser Icon",
    title: "Favicon",
  },
};

export default function AdminBranding() {
  const [logos, setLogos] = useState<Record<LogoSlot, string | null>>({
    header: null,
    footer: null,
    favicon: null,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<LogoSlot, boolean>>({
    header: false,
    footer: false,
    favicon: false,
  });

  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);
  const faviconFileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .in("key", [logoConfigs.header.key, logoConfigs.footer.key, logoConfigs.favicon.key]);

    if (error) {
      toast.error("Failed to load logo settings");
      setLoading(false);
      return;
    }

    const nextLogos: Record<LogoSlot, string | null> = { header: null, footer: null, favicon: null };
    data?.forEach((setting) => {
      if (setting.key === logoConfigs.header.key) nextLogos.header = setting.value;
      if (setting.key === logoConfigs.footer.key) nextLogos.footer = setting.value;
      if (setting.key === logoConfigs.favicon.key) nextLogos.favicon = setting.value;
    });
    setLogos(nextLogos);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getInputRef = (slot: LogoSlot) => {
    if (slot === "header") return headerFileInputRef;
    if (slot === "footer") return footerFileInputRef;
    return faviconFileInputRef;
  };

  const handleUpload = async (slot: LogoSlot, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    const config = logoConfigs[slot];
    setUploading((prev) => ({ ...prev, [slot]: true }));
    const fileExt = file.name.split(".").pop();
    const fileName = `${config.bucketPrefix}_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage.from("logos").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("logos").getPublicUrl(fileName);

      const { error: dbError } = await supabase.from("site_settings").upsert(
        {
          key: config.key,
          value: publicUrl,
        },
        { onConflict: "key" }
      );

      if (dbError) throw dbError;

      setLogos((prev) => ({ ...prev, [slot]: publicUrl }));
      toast.success(`${config.title} updated successfully`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to upload ${config.title.toLowerCase()}`);
    } finally {
      setUploading((prev) => ({ ...prev, [slot]: false }));
      const inputRef = getInputRef(slot);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleReset = async (slot: LogoSlot) => {
    const config = logoConfigs[slot];
    if (!confirm(`Are you sure you want to reset the ${config.title.toLowerCase()} to default?`)) return;

    setUploading((prev) => ({ ...prev, [slot]: true }));
    try {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: config.key,
          value: null,
        },
        { onConflict: "key" }
      );

      if (error) throw error;

      setLogos((prev) => ({ ...prev, [slot]: null }));
      toast.success(`${config.title} reset to default`);
    } catch (error) {
      toast.error(`Failed to reset ${config.title.toLowerCase()}`);
    } finally {
      setUploading((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const renderLogoPanel = (slot: LogoSlot) => {
    const config = logoConfigs[slot];
    const currentLogo = logos[slot];
    const isUploading = uploading[slot];
    const inputRef = getInputRef(slot);
    const previewClass =
      slot === "footer"
        ? "bg-gray-950 border-white/10"
        : "bg-white border-gray-200";

    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            {config.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-10 items-center justify-center">
            <div className="w-full md:w-1/2 flex flex-col items-center">
              <div className={`w-full max-w-sm aspect-video rounded-xl border flex items-center justify-center p-8 relative overflow-hidden group ${previewClass}`}>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-primary/10 rounded-full blur-[50px] pointer-events-none" />

                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <img
                    src={currentLogo || config.defaultPath}
                    alt={config.title}
                    className={`${slot === "favicon" ? "max-w-20 max-h-20" : "max-w-full max-h-full"} object-contain relative z-10 drop-shadow-xl`}
                  />
                )}

                <div className="absolute bottom-3 right-3 text-[10px] font-mono text-white/40 uppercase tracking-widest bg-black/50 px-2 py-1 rounded">
                  {config.previewLabel}
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-sm font-medium text-primary">Current {config.title}</span>
                <p className="text-xs text-muted-foreground mt-1">{currentLogo ? "Custom Upload" : "Default Logo"}</p>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col items-center justify-center space-y-6">
              <input
                type="file"
                accept="image/png, image/jpeg, image/svg+xml, image/webp, image/x-icon, image/vnd.microsoft.icon"
                className="hidden"
                ref={inputRef}
                onChange={(event) => handleUpload(slot, event)}
              />

              <div
                onClick={() => !isUploading && inputRef.current?.click()}
                className={`w-full max-w-[240px] aspect-square rounded-full border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {isUploading ? (
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                ) : (
                  <Upload className="w-10 h-10 text-muted-foreground" />
                )}
                <div className="text-center px-4">
                  <p className="font-medium text-sm">Upload {config.title.toLowerCase()}</p>
                  <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG, ICO (max 2MB)</p>
                </div>
              </div>

              {currentLogo && (
                <Button
                  variant="ghost"
                  onClick={() => handleReset(slot)}
                  disabled={isUploading}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  Reset to Default
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Branding</h1>
        <p className="text-muted-foreground mt-1">Manage header logo, footer logo, and favicon separately.</p>
      </div>

      {renderLogoPanel("header")}
      {renderLogoPanel("footer")}
      {renderLogoPanel("favicon")}
    </div>
  );
}

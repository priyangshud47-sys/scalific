"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe2, Loader2, Save, Search, Upload } from "lucide-react";

type SettingField = {
  key: string;
  label: string;
  placeholder: string;
  textarea?: boolean;
};

const seoFields: SettingField[] = [
  { key: "seo_title", label: "SEO Title", placeholder: "Scalific | Digital Growth Agency" },
  {
    key: "seo_description",
    label: "SEO Description",
    placeholder: "A short search-friendly description of your agency.",
    textarea: true,
  },
  { key: "seo_keywords", label: "SEO Keywords", placeholder: "digital agency, web design, marketing, branding" },
  { key: "seo_canonical_url", label: "Canonical URL", placeholder: "https://scalific.com" },
  { key: "seo_og_title", label: "Social Share Title", placeholder: "Scalific" },
  {
    key: "seo_og_description",
    label: "Social Share Description",
    placeholder: "Description used when the site is shared.",
    textarea: true,
  },
  { key: "seo_og_image", label: "Social Share Image (Open Graph)", placeholder: "https://.../share-image.png" },
];

const geoFields: SettingField[] = [
  { 
    key: "geo_ai_summary", 
    label: "AI-Targeted Summary", 
    placeholder: "A highly factual, citation-ready overview of your agency's services, team, and credibility points for AI search engines (e.g. Gemini, SearchGPT, Perplexity).", 
    textarea: true 
  },
  { 
    key: "geo_semantic_keywords", 
    label: "Semantic Focus Keywords", 
    placeholder: "e.g. premium digital agency, data-driven brand consulting, B2B SaaS web design" 
  },
  { 
    key: "geo_json_ld_schema", 
    label: "JSON-LD Schema Markup (Structured Data)", 
    placeholder: "Paste organization/website JSON-LD schema here to help AI search engines parse structural entities...", 
    textarea: true 
  },
  { 
    key: "geo_crawlers_policy", 
    label: "AI Crawler/Robots Policy", 
    placeholder: "e.g. index, noarchive or index, follow" 
  },
];

const allFields = [...seoFields, ...geoFields];

export default function AdminSeoGeo() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const ogImageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", allFields.map((field) => field.key))
      .then(({ data, error }) => {
        if (error) {
          toast.error("Failed to load SEO/GEO settings");
        } else {
          setValues(Object.fromEntries((data || []).map((item) => [item.key, item.value || ""])));
        }
        setLoading(false);
      });
  }, []);

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploadingImage(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `seo_og_image_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(fileName);

      updateValue("seo_og_image", publicUrl);
      toast.success("Social share image uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload social share image");
    } finally {
      setUploadingImage(false);
      if (ogImageFileInputRef.current) ogImageFileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = allFields.map((field) => ({
      key: field.key,
      value: values[field.key] || null,
    }));

    const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "key" });
    setSaving(false);

    if (error) {
      toast.error(`Failed to save settings: ${error.message}`);
    } else {
      toast.success("SEO and GEO settings saved");
    }
  };

  const renderField = (field: SettingField) => {
    if (field.key === "seo_og_image") {
      const currentImage = values.seo_og_image;
      return (
        <div key={field.key} className="space-y-3">
          <Label htmlFor={field.key}>{field.label}</Label>
          
          {/* Visual Preview */}
          {currentImage ? (
            <div className="relative w-full aspect-video rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center p-2 group">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
              <img
                src={currentImage}
                alt="OG Share Preview"
                className="max-h-full max-w-full object-contain rounded-lg shadow-md z-10 transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-xl border border-dashed border-border bg-muted/10 flex flex-col items-center justify-center p-4 text-center">
              <span className="text-xs text-muted-foreground">No social share image uploaded yet</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              id={field.key}
              value={currentImage || ""}
              onChange={(event) => updateValue(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="flex-1 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingImage}
              onClick={() => ogImageFileInputRef.current?.click()}
              className="gap-2 shrink-0"
            >
              {uploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload
            </Button>
            {currentImage && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => updateValue("seo_og_image", "")}
                className="text-destructive hover:bg-destructive/10 shrink-0"
              >
                Clear
              </Button>
            )}
          </div>
          <input
            type="file"
            ref={ogImageFileInputRef}
            onChange={handleOgImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        {field.textarea ? (
          <Textarea
            id={field.key}
            value={values[field.key] || ""}
            onChange={(event) => updateValue(field.key, event.target.value)}
            placeholder={field.placeholder}
            className={`min-h-24 ${field.key === "geo_json_ld_schema" ? "font-mono text-xs" : "font-sans text-sm"}`}
          />
        ) : (
          <Input
            id={field.key}
            value={values[field.key] || ""}
            onChange={(event) => updateValue(field.key, event.target.value)}
            placeholder={field.placeholder}
            className={field.key === "geo_crawlers_policy" ? "font-mono text-xs" : "font-sans text-sm"}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">SEO & GEO</h1>
          <p className="text-muted-foreground mt-1">
            Manage browser title, search metadata, social previews, and Generative Engine Optimization (GEO) markup for AI search engines.
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading || saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-card rounded-xl border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              SEO
            </h2>
            {seoFields.map(renderField)}
          </section>

          <section className="bg-card rounded-xl border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-muted-foreground" />
              GEO (Generative Engine Optimization)
            </h2>
            {geoFields.map(renderField)}
          </section>
        </div>
      )}
    </div>
  );
}

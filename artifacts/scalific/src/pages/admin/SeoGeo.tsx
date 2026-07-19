"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe2, Loader2, Save, Search } from "lucide-react";

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
  { key: "seo_og_image", label: "Social Share Image URL", placeholder: "https://.../share-image.png" },
];

const geoFields: SettingField[] = [
  { key: "geo_region", label: "Geo Region", placeholder: "IN-WB or US-CA" },
  { key: "geo_placename", label: "Place Name", placeholder: "Kolkata, India" },
  { key: "geo_position", label: "Geo Position", placeholder: "22.5726;88.3639" },
  { key: "geo_icbm", label: "ICBM Coordinates", placeholder: "22.5726, 88.3639" },
];

const allFields = [...seoFields, ...geoFields];

export default function AdminSeoGeo() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const renderField = (field: SettingField) => (
    <div key={field.key} className="space-y-2">
      <Label htmlFor={field.key}>{field.label}</Label>
      {field.textarea ? (
        <Textarea
          id={field.key}
          value={values[field.key] || ""}
          onChange={(event) => updateValue(field.key, event.target.value)}
          placeholder={field.placeholder}
          className="min-h-24"
        />
      ) : (
        <Input
          id={field.key}
          value={values[field.key] || ""}
          onChange={(event) => updateValue(field.key, event.target.value)}
          placeholder={field.placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">SEO & GEO</h1>
          <p className="text-muted-foreground mt-1">Manage browser title, search metadata, social previews, and location metadata.</p>
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
              GEO
            </h2>
            {geoFields.map(renderField)}
          </section>
        </div>
      )}
    </div>
  );
}

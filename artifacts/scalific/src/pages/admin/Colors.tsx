"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { applyBrandColor, hexToHsl, hslToHex } from "@/lib/brandColor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Palette, RotateCcw } from "lucide-react";

const DEFAULT_COLOR = "#22C55E";

const PRESETS = [
  { label: "Scalific Green", hex: "#22C55E" },
  { label: "Ocean Blue",     hex: "#3B82F6" },
  { label: "Royal Purple",   hex: "#8B5CF6" },
  { label: "Sunset Orange",  hex: "#F97316" },
  { label: "Rose Red",       hex: "#EF4444" },
  { label: "Teal",           hex: "#14B8A6" },
  { label: "Amber",          hex: "#F59E0B" },
  { label: "Slate",          hex: "#64748B" },
];

export default function AdminColors() {
  const [currentHex, setCurrentHex] = useState(DEFAULT_COLOR);
  const [inputHex, setInputHex] = useState(DEFAULT_COLOR);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .eq("key", "color_primary")
      .maybeSingle()
      .then(({ data }) => {
        const hex = data?.value || DEFAULT_COLOR;
        setCurrentHex(hex);
        setInputHex(hex);
        setLoading(false);
      });
  }, []);

  const isValidHex = (h: string) => /^#[0-9A-Fa-f]{6}$/.test(h);

  const handlePickerChange = (hex: string) => {
    setInputHex(hex);
    setCurrentHex(hex);
    applyBrandColor(hex);
  };

  const handleTextChange = (val: string) => {
    setInputHex(val);
    const normalized = val.startsWith("#") ? val : `#${val}`;
    if (isValidHex(normalized)) {
      setCurrentHex(normalized);
      applyBrandColor(normalized);
    }
  };

  const handlePreset = (hex: string) => {
    setCurrentHex(hex);
    setInputHex(hex);
    applyBrandColor(hex);
  };

  const handleSave = async () => {
    if (!isValidHex(currentHex)) {
      toast.error("Please enter a valid hex color (e.g. #22C55E)");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      { key: "color_primary", value: currentHex },
      { onConflict: "key" }
    );
    setSaving(false);
    if (error) {
      toast.error(`Failed to save color: ${error.message}`);
    } else {
      toast.success("Brand color saved — changes are live on the public site.");
    }
  };

  const handleReset = () => {
    handlePreset(DEFAULT_COLOR);
  };

  const hsl = hexToHsl(currentHex);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Brand Colors</h1>
        <p className="text-muted-foreground mt-1">
          Set your primary brand color. It updates buttons, accents, and highlights across the entire site.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Picker Card */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-muted-foreground" />
              Primary Color
            </h2>

            {/* Big color preview + picker */}
            <div className="flex items-center gap-4">
              <label className="cursor-pointer" title="Click to open color picker">
                <div
                  className="w-20 h-20 rounded-xl border-2 border-white shadow-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: currentHex, borderColor: currentHex }}
                />
                <input
                  type="color"
                  value={currentHex}
                  onChange={(e) => handlePickerChange(e.target.value)}
                  className="sr-only"
                />
              </label>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={inputHex}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="font-mono uppercase tracking-widest"
                    maxLength={7}
                    placeholder="#22C55E"
                  />
                </div>
                {hsl && (
                  <p className="text-xs text-muted-foreground font-mono">
                    HSL: {hsl.h}° {hsl.s}% {hsl.l}%
                  </p>
                )}
              </div>
            </div>

            {/* Presets */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Presets</p>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.hex}
                    title={p.label}
                    onClick={() => handlePreset(p.hex)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                      currentHex.toLowerCase() === p.hex.toLowerCase()
                        ? "border-foreground shadow-md scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: p.hex }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {PRESETS.map((p) => (
                  <p key={p.hex} className="text-[9px] text-muted-foreground text-center truncate">{p.label}</p>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {saving ? "Saving…" : "Save Color"}
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset} title="Reset to default green">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-lg">Live Preview</h2>

            <div className="space-y-4">
              {/* Badge */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Badge / Tag</p>
                <span
                  className="inline-block py-1 px-3 rounded-full text-sm font-semibold tracking-wider text-white"
                  style={{ backgroundColor: currentHex }}
                >
                  PREMIUM DIGITAL AGENCY
                </span>
              </div>

              {/* Buttons */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Buttons</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: currentHex }}
                  >
                    Get Started
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors hover:opacity-80"
                    style={{ color: currentHex, borderColor: currentHex, backgroundColor: `${currentHex}15` }}
                  >
                    Learn More
                  </button>
                </div>
              </div>

              {/* Accent text */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Accent Text</p>
                <p className="font-display text-2xl font-bold">
                  Core{" "}
                  <span style={{ color: currentHex }}>Expertise</span>
                </p>
              </div>

              {/* Icon box */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Icon & Border</p>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${currentHex}20`, border: `1px solid ${currentHex}40` }}
                >
                  <Palette className="w-6 h-6" style={{ color: currentHex }} />
                </div>
              </div>

              {/* Shadow and glow */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Shadow / Glow</p>
                <div
                  className="h-16 rounded-xl border flex items-center justify-center text-sm font-semibold"
                  style={{
                    borderColor: `${currentHex}30`,
                    boxShadow: `0 18px 48px -18px ${currentHex}99, 0 0 40px -14px ${currentHex}`,
                    backgroundColor: `${currentHex}10`,
                    color: currentHex,
                  }}
                >
                  Brand shadow follows this color
                </div>
              </div>

              {/* Hex reference */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Current hex: <span className="font-mono font-medium text-foreground">{currentHex}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

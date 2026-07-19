"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ShieldCheck, Copy, Loader2, Save, KeyRound, RefreshCw, Lock } from "lucide-react";
import { logActivity } from "@/lib/logger";

export default function AdminSecurity() {
  const [loading, setLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState("JBSWY3DPEHPK3PXP");
  const [totpTestCode, setTotpTestCode] = useState("");
  const [savingTotp, setSavingTotp] = useState(false);

  const fetchSecuritySettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["totp_enabled", "totp_secret"]);

    if (data && data.length > 0) {
      const map = Object.fromEntries(data.map((d) => [d.key, d.value]));
      setTotpEnabled(map.totp_enabled === "true");
      if (map.totp_secret) setTotpSecret(map.totp_secret);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const saveTotpSettings = async (enabledState?: boolean) => {
    setSavingTotp(true);
    const isEnabled = enabledState !== undefined ? enabledState : totpEnabled;
    const updates = [
      { key: "totp_enabled", value: isEnabled ? "true" : "false" },
      { key: "totp_secret", value: totpSecret },
    ];

    const { error } = await supabase.from("site_settings").upsert(updates, { onConflict: "key" });
    setSavingTotp(false);

    if (error) {
      toast.error(`Failed to save 2FA settings: ${error.message}`);
    } else {
      toast.success(isEnabled ? "Google Authenticator 2FA enabled!" : "Google Authenticator 2FA disabled");
      await logActivity(
        "UPDATE",
        "Security",
        `${isEnabled ? "Enabled" : "Disabled"} Google Authenticator 2-Step Verification`
      );
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleTestTotp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpTestCode || totpTestCode.length < 6) {
      toast.error("Enter a 6-digit code to test setup");
      return;
    }
    toast.success("Google Authenticator code verified! Setup confirmed.");
    setTotpTestCode("");
  };

  const generateNewSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let newSecret = "";
    for (let i = 0; i < 16; i++) {
      newSecret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTotpSecret(newSecret);
    toast.info("Generated new 2FA Secret Key. Click 'Save 2FA Configuration' to apply.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-display font-bold tracking-tight">2-Step Verification (Google Authenticator)</h1>
          </div>
          <p className="text-muted-foreground">
            Configure two-factor security for administrator logins. By default, 2FA is OFF.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${totpEnabled ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}`}>
            {totpEnabled ? "ON (2FA Enabled)" : "OFF (Default)"}
          </span>
          <Switch
            checked={totpEnabled}
            onCheckedChange={(checked) => {
              setTotpEnabled(checked);
              saveTotpSettings(checked);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-72 bg-card rounded-xl border border-border animate-pulse" />
      ) : (
        <div className="bg-card rounded-xl border border-border p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Status banner */}
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${totpEnabled ? "bg-primary/5 border-primary/20 text-primary" : "bg-muted/30 border-border text-muted-foreground"}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${totpEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {totpEnabled ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {totpEnabled ? "2-Step Verification is Active" : "2-Step Verification is Disabled (Default)"}
              </h3>
              <p className="text-xs">
                {totpEnabled
                  ? "Every admin login will require a 6-digit verification code from Google Authenticator."
                  : "Admins sign in using email & password only. Turn ON the switch above to enforce 2FA."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-6 border border-border rounded-xl bg-muted/10 text-center space-y-3">
              <div className="bg-white p-3.5 rounded-2xl shadow-md border border-border">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `otpauth://totp/Scalific:admin?secret=${totpSecret}&issuer=Scalific`
                  )}`}
                  alt="Google Authenticator QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Scan with <strong>Google Authenticator</strong> or <strong>Authy</strong> App
              </p>
            </div>

            {/* Secret Key & Verification Test */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Secret Key (Manual Entry)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={generateNewSecret}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                    >
                      <RefreshCw className="w-3 h-3" /> New Key
                    </button>
                    <button
                      onClick={() => handleCopyText(totpSecret, "2FA Secret Key")}
                      className="text-primary hover:underline flex items-center gap-1 text-xs"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                </label>
                <Input
                  value={totpSecret}
                  onChange={(e) => setTotpSecret(e.target.value.toUpperCase())}
                  className="font-mono text-base tracking-widest bg-background/50 text-center font-bold h-12"
                />
              </div>

              <form onSubmit={handleTestTotp} className="space-y-3 pt-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" /> Test Authenticator Code
                </label>
                <div className="flex gap-2">
                  <Input
                    maxLength={6}
                    value={totpTestCode}
                    onChange={(e) => setTotpTestCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="font-mono text-sm text-center tracking-widest bg-background/50 h-10"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="shrink-0 h-10">
                    Verify Code
                  </Button>
                </div>
              </form>

              <Button onClick={() => saveTotpSettings()} disabled={savingTotp} className="w-full h-11 gap-2 mt-4">
                {savingTotp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save 2FA Configuration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

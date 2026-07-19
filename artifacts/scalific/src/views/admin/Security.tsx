"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ShieldCheck, Copy, Loader2, Save, KeyRound, RefreshCw, Lock, CheckCircle2, RotateCcw, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { logActivity } from "@/lib/logger";
import { generateRandomSecretKey, verifyTOTPCode } from "@/lib/totp";

export default function AdminSecurity() {
  const [loading, setLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState("JBSWY3DPEHPK3PXP");
  const [totpTestCode, setTotpTestCode] = useState("");
  const [verifyingTest, setVerifyingTest] = useState(false);
  const [savingTotp, setSavingTotp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const fetchSecuritySettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["totp_enabled", "totp_secret"]);

    if (data && data.length > 0) {
      const map = Object.fromEntries(data.map((d) => [d.key, d.value]));
      const enabled = map.totp_enabled === "true";
      setTotpEnabled(enabled);
      if (map.totp_secret) setTotpSecret(map.totp_secret);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const saveTotpSettings = async (enabledState?: boolean, customSecret?: string) => {
    setSavingTotp(true);
    const isEnabled = enabledState !== undefined ? enabledState : totpEnabled;
    const secretToSave = customSecret || totpSecret;

    const updates = [
      { key: "totp_enabled", value: isEnabled ? "true" : "false" },
      { key: "totp_secret", value: secretToSave },
    ];

    const { error } = await supabase.from("site_settings").upsert(updates, { onConflict: "key" });
    setSavingTotp(false);

    if (error) {
      toast.error(`Failed to save 2FA settings: ${error.message}`);
    } else {
      setTotpEnabled(isEnabled);
      setIsResetting(false);
      toast.success(
        isEnabled
          ? "Google Authenticator 2FA saved & activated!"
          : "Google Authenticator 2FA disabled"
      );
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

  const handleTestAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = totpTestCode.trim().replace(/\D/g, "");
    if (cleanCode.length < 6) {
      toast.error("Please enter a valid 6-digit Google Authenticator code");
      return;
    }

    setVerifyingTest(true);
    const isValid = await verifyTOTPCode(cleanCode, totpSecret);
    setVerifyingTest(false);

    if (!isValid) {
      toast.error("Invalid 6-digit code! Please check your Google Authenticator app and try again.");
      return;
    }

    toast.success("Google Authenticator code verified! Activating 2FA...");
    await saveTotpSettings(true);
    setTotpTestCode("");
  };

  const handleStartReset = () => {
    const newKey = generateRandomSecretKey();
    setTotpSecret(newKey);
    setIsResetting(true);
    setTotpTestCode("");
    toast.info("Generated new 2FA Secret Key! Scan the new QR code in Google Authenticator and test the 6-digit code.");
  };

  const maskedSecret = `${totpSecret.slice(0, 4)} •••• •••• ${totpSecret.slice(-4)}`;

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
            Enforce Google Authenticator 2-step verification for all administrator logins.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${totpEnabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground border-border"}`}>
            {totpEnabled ? "Active & Protected ✓" : "Disabled"}
          </span>
          <Switch
            checked={totpEnabled}
            onCheckedChange={(checked) => {
              if (checked) {
                setIsResetting(true);
              } else {
                saveTotpSettings(false);
              }
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-72 bg-card rounded-xl border border-border animate-pulse" />
      ) : totpEnabled && !isResetting ? (
        /* Configured & Active Screen */
        <div className="bg-card rounded-xl border border-border p-6 sm:p-8 space-y-8 shadow-sm">
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">Google Authenticator is Configured & Active</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your admin account is protected by 2-step verification. Whenever you sign in with your password, you will be prompted to enter the 6-digit code generated by your Google Authenticator app.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Current Device Details */}
            <div className="p-5 border border-border rounded-xl bg-muted/10 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Configured Secret Key</span>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showSecret ? "Hide" : "Show Key"}
                </button>
              </h4>

              <div className="p-3 rounded-lg bg-background border border-border flex items-center justify-between font-mono text-sm font-bold tracking-widest">
                <span>{showSecret ? totpSecret : maskedSecret}</span>
                <button
                  type="button"
                  onClick={() => handleCopyText(totpSecret, "2FA Secret Key")}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-sans font-normal"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Issuer: <strong>Scalific Admin</strong> | Protocol: <strong>RFC 6238 TOTP (SHA1)</strong>
              </p>
            </div>

            {/* Reset & Device Controls */}
            <div className="p-5 border border-border rounded-xl bg-muted/10 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Device & Key Management
                </h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Lost your phone, switched to a new device, or want to change your Google Authenticator key? Use the reset option below.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleStartReset}
                  variant="outline"
                  className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset & Change Device
                </Button>

                <Button
                  onClick={() => saveTotpSettings(false)}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Turn OFF 2FA
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Setup / Reset QR Code View */
        <div className="bg-card rounded-xl border border-border p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Header Banner */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {isResetting ? "Re-configuring Google Authenticator Device" : "Set Up Google Authenticator 2-Step Verification"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Scan the QR code below using Google Authenticator or Authy, then enter the 6-digit verification code to confirm setup.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
            {/* QR Code Display */}
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

            {/* Secret Key & Verification Form */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Secret Key (Manual Entry)</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const newKey = generateRandomSecretKey();
                        setTotpSecret(newKey);
                        toast.info("Generated new 2FA secret key!");
                      }}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                    >
                      <RefreshCw className="w-3 h-3" /> New Key
                    </button>
                    <button
                      type="button"
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

              {/* Verify Test Code Form */}
              <form onSubmit={handleTestAndEnable} className="space-y-4 pt-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" /> Enter 6-Digit Code to Confirm
                </label>
                <div className="flex gap-2">
                  <Input
                    maxLength={6}
                    value={totpTestCode}
                    onChange={(e) => setTotpTestCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000 000"
                    className="font-mono text-base text-center tracking-widest bg-background/50 h-12 font-bold"
                  />
                  <Button
                    type="submit"
                    disabled={verifyingTest || savingTotp || totpTestCode.length < 6}
                    className="shrink-0 h-12 px-6 gap-2"
                  >
                    {verifyingTest || savingTotp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Verify & Activate
                  </Button>
                </div>
              </form>

              {totpEnabled && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsResetting(false)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Cancel Reset & Keep Current Device
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck, Lock, ArrowLeft, KeyRound } from "lucide-react";
import { logActivity } from "@/lib/logger";
import { verifyTOTPCode } from "@/lib/totp";

const logoPath = "/assets/scalific-logo.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AdminLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"login" | "totp">("login");
  const [totpCode, setTotpCode] = useState("");
  const [verifyingTotp, setVerifyingTotp] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string } | null>(null);

  const [adminLogoUrl, setAdminLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "logo_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setAdminLogoUrl(data.value);
        }
      });
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      const { data: totpSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "totp_enabled")
        .maybeSingle();

      if (totpSetting?.value === "true") {
        setPendingCredentials({ email: values.email });
        setStep("totp");
        toast.info("Password verified! Enter your 6-digit Google Authenticator code.");
      } else {
        toast.success("Logged in successfully");
        await logActivity("LOGIN", "Auth", `User ${values.email} logged in`);
        router.push("/admin/services");
      }
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = totpCode.trim().replace(/\D/g, "");
    if (cleanCode.length < 6) {
      toast.error("Please enter a valid 6-digit Google Authenticator code");
      return;
    }

    setVerifyingTotp(true);

    try {
      const { data: secretData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "totp_secret")
        .maybeSingle();

      const secret = secretData?.value || "JBSWY3DPEHPK3PXP";
      const isValid = await verifyTOTPCode(cleanCode, secret);

      if (!isValid) {
        toast.error("Invalid 6-digit code! Please check Google Authenticator and try again.");
        setVerifyingTotp(false);
        return;
      }

      toast.success("2-Step Verification verified! Welcome back.");
      await logActivity("LOGIN", "Auth", `User ${pendingCredentials?.email || "admin"} authenticated with 2FA`);
      router.push("/admin/services");
    } catch (err: any) {
      toast.error(`Verification error: ${err?.message || err}`);
    } finally {
      setVerifyingTotp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <img src={adminLogoUrl || logoPath} alt="Scalific" className="h-12 w-auto object-contain" />
        </div>
        
        <Card className="border-border bg-white shadow-2xl overflow-hidden">
          {step === "login" ? (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-display font-bold tracking-tight">Admin Portal</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Sign in to manage Scalific website content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="admin@scalific.com" {...field} className="bg-gray-50 border-gray-200 focus-visible:ring-primary h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} className="bg-gray-50 border-gray-200 focus-visible:ring-primary h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-12 text-base font-semibold mt-6 tracking-wide" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Continue to 2-Step Verification"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-2 text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-display font-bold tracking-tight">2-Step Verification</CardTitle>
                <CardDescription className="text-muted-foreground text-xs leading-relaxed">
                  Open your <strong>Google Authenticator</strong> app and enter your 6-digit verification code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyTotp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-primary" /> 6-Digit Code
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000 000"
                      className="bg-gray-50 border-gray-200 focus-visible:ring-primary h-14 text-center text-2xl font-mono tracking-[0.3em] font-bold"
                      autoFocus
                    />
                  </div>
                  
                  <Button type="submit" className="w-full h-12 text-base font-semibold tracking-wide gap-2" disabled={verifyingTotp}>
                    {verifyingTotp ? "Verifying..." : "Verify & Complete Login"}
                  </Button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setStep("login")}
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Password Sign In
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

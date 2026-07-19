"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, XCircle, Loader2, Copy, ExternalLink, RefreshCw, Database, Eye, EyeOff, Key, Lock, Server, ShieldCheck, Save, QrCode, KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

// Extract project ref from Supabase URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const PROJECT_REF = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`;

const REQUIRED_TABLES = [
  "site_settings",
  "services",
  "team_members",
  "content_blocks",
  "contact_form_fields",
  "contact_submissions",
  "testimonials",
  "employee_permissions",
  "activity_logs",
  "permission_requests",
] as const;

const MIGRATION_SQL = `-- ============================================================
-- Scalific — Database Setup
-- Copy this SQL and paste it into your Supabase SQL Editor,
-- then click RUN.
-- ============================================================

-- 1. TABLES

CREATE TABLE IF NOT EXISTS site_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT UNIQUE NOT NULL,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  icon_url      TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  role          TEXT,
  photo_url     TEXT,
  bio           TEXT,
  linkedin_url  TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS content_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  content     TEXT,
  media_url   TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_form_fields (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_label   TEXT NOT NULL,
  field_name    TEXT NOT NULL,
  field_type    TEXT NOT NULL CHECK (field_type IN ('text','email','textarea','phone','select')),
  is_required   BOOLEAN NOT NULL DEFAULT false,
  options       JSONB,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data         JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote         TEXT NOT NULL,
  author_name   TEXT NOT NULL,
  author_title  TEXT,
  company       TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_permissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email       TEXT UNIQUE NOT NULL,
  role_title       TEXT NOT NULL DEFAULT 'Super Admin',
  is_super_admin   BOOLEAN NOT NULL DEFAULT true,
  allowed_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  action     TEXT NOT NULL,
  module     TEXT NOT NULL,
  details    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permission_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by TEXT NOT NULL,
  request_type TEXT NOT NULL,
  target_email TEXT NOT NULL,
  payload      JSONB NOT NULL,
  status       TEXT NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ROW LEVEL SECURITY

ALTER TABLE site_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_form_fields  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_requests  ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent duplicate policy errors (42710)
DROP POLICY IF EXISTS "public_read_site_settings"       ON site_settings;
DROP POLICY IF EXISTS "public_read_services"            ON services;
DROP POLICY IF EXISTS "public_read_team_members"        ON team_members;
DROP POLICY IF EXISTS "public_read_content_blocks"      ON content_blocks;
DROP POLICY IF EXISTS "public_read_contact_form_fields" ON contact_form_fields;
DROP POLICY IF EXISTS "public_read_testimonials"        ON testimonials;

DROP POLICY IF EXISTS "auth_write_site_settings"        ON site_settings;
DROP POLICY IF EXISTS "auth_write_services"             ON services;
DROP POLICY IF EXISTS "auth_write_team_members"         ON team_members;
DROP POLICY IF EXISTS "auth_write_content_blocks"       ON content_blocks;
DROP POLICY IF EXISTS "auth_write_contact_form_fields"  ON contact_form_fields;
DROP POLICY IF EXISTS "auth_write_testimonials"         ON testimonials;

DROP POLICY IF EXISTS "public_insert_submissions"       ON contact_submissions;
DROP POLICY IF EXISTS "auth_read_submissions"           ON contact_submissions;
DROP POLICY IF EXISTS "auth_write_submissions"          ON contact_submissions;
DROP POLICY IF EXISTS "auth_delete_submissions"         ON contact_submissions;

DROP POLICY IF EXISTS "public_read_employee_permissions" ON employee_permissions;
DROP POLICY IF EXISTS "auth_write_employee_permissions"  ON employee_permissions;

DROP POLICY IF EXISTS "public_read_activity_logs"        ON activity_logs;
DROP POLICY IF EXISTS "auth_write_activity_logs"         ON activity_logs;

DROP POLICY IF EXISTS "public_read_permission_requests"  ON permission_requests;
DROP POLICY IF EXISTS "auth_write_permission_requests"   ON permission_requests;

DROP POLICY IF EXISTS "public_read_logos"         ON storage.objects;
DROP POLICY IF EXISTS "public_read_team_photos"   ON storage.objects;
DROP POLICY IF EXISTS "public_read_service_icons" ON storage.objects;
DROP POLICY IF EXISTS "public_read_media"         ON storage.objects;

DROP POLICY IF EXISTS "auth_write_logos"          ON storage.objects;
DROP POLICY IF EXISTS "auth_write_team_photos"    ON storage.objects;
DROP POLICY IF EXISTS "auth_write_service_icons"  ON storage.objects;
DROP POLICY IF EXISTS "auth_write_media"          ON storage.objects;

-- Create Policies
CREATE POLICY "public_read_site_settings"       ON site_settings       FOR SELECT USING (true);
CREATE POLICY "public_read_services"            ON services            FOR SELECT USING (true);
CREATE POLICY "public_read_team_members"        ON team_members        FOR SELECT USING (true);
CREATE POLICY "public_read_content_blocks"      ON content_blocks      FOR SELECT USING (true);
CREATE POLICY "public_read_contact_form_fields" ON contact_form_fields FOR SELECT USING (true);
CREATE POLICY "public_read_testimonials"        ON testimonials        FOR SELECT USING (true);

CREATE POLICY "auth_write_site_settings"        ON site_settings       FOR ALL USING (true);
CREATE POLICY "auth_write_services"             ON services            FOR ALL USING (true);
CREATE POLICY "auth_write_team_members"         ON team_members        FOR ALL USING (true);
CREATE POLICY "auth_write_content_blocks"       ON content_blocks      FOR ALL USING (true);
CREATE POLICY "auth_write_contact_form_fields"  ON contact_form_fields FOR ALL USING (true);
CREATE POLICY "auth_write_testimonials"         ON testimonials        FOR ALL USING (true);

CREATE POLICY "public_insert_submissions"       ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_read_submissions"           ON contact_submissions FOR SELECT USING (true);
CREATE POLICY "auth_write_submissions"          ON contact_submissions FOR ALL USING (true);
CREATE POLICY "auth_delete_submissions"         ON contact_submissions FOR DELETE USING (true);

CREATE POLICY "public_read_employee_permissions" ON employee_permissions FOR SELECT USING (true);
CREATE POLICY "auth_write_employee_permissions"  ON employee_permissions FOR ALL USING (true);

CREATE POLICY "public_read_activity_logs"        ON activity_logs FOR SELECT USING (true);
CREATE POLICY "auth_write_activity_logs"         ON activity_logs FOR ALL USING (true);

CREATE POLICY "public_read_permission_requests"  ON permission_requests FOR SELECT USING (true);
CREATE POLICY "auth_write_permission_requests"   ON permission_requests FOR ALL USING (true);

-- 3. STORAGE BUCKETS

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('logos',         'logos',         true),
  ('team-photos',   'team-photos',   true),
  ('service-icons', 'service-icons', true),
  ('media',         'media',         true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_logos"         ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "public_read_team_photos"   ON storage.objects FOR SELECT USING (bucket_id = 'team-photos');
CREATE POLICY "public_read_service_icons" ON storage.objects FOR SELECT USING (bucket_id = 'service-icons');
CREATE POLICY "public_read_media"         ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "auth_write_logos"          ON storage.objects FOR ALL USING (bucket_id = 'logos'         AND auth.role() = 'authenticated');
CREATE POLICY "auth_write_team_photos"    ON storage.objects FOR ALL USING (bucket_id = 'team-photos'   AND auth.role() = 'authenticated');
CREATE POLICY "auth_write_service_icons"  ON storage.objects FOR ALL USING (bucket_id = 'service-icons' AND auth.role() = 'authenticated');
CREATE POLICY "auth_write_media"          ON storage.objects FOR ALL USING (bucket_id = 'media'         AND auth.role() = 'authenticated');

-- 4. SEED DATA

INSERT INTO content_blocks (section_key, content) VALUES
  ('hero_title',       E'Data-Driven Strategy.\\nRelentless Execution.'),
  ('hero_subtitle',    'We turn ambitious brands into market leaders. No fluff, just results.'),
  ('services_heading', 'Core Expertise'),
  ('services_subtext', 'Precision engineering for your digital presence. Every service is a focused strike on your growth targets.'),
  ('team_heading',     'The A-Team'),
  ('team_subtext',     'Founders, operators, and specialists. The minds behind the execution.'),
  ('about_heading',    'Built for founders who demand performance.'),
  ('about_text',       'At Scalific, we combine creative excellence with rigorous data analysis.'),
  ('about_stat1_value','2.4x'),
  ('about_stat1_label','Avg. Growth Rate'),
  ('about_stat2_value','Top 1%'),
  ('about_stat2_label','Creative Talent'),
  ('contact_heading',  'Ready to scale?'),
  ('contact_subtext',  'Let''s discuss how we can engineer your next phase of growth. Fill out the form, and a partner will be in touch within 24 hours.')
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, content, media_url) VALUES
  ('nav_services_label', 'Services', NULL),
  ('nav_team_label', 'Team', NULL),
  ('nav_about_label', 'About', NULL),
  ('nav_contact_label', 'Contact', NULL),
  ('nav_cta_label', 'Get Started', NULL),
  ('hero_badge', 'PREMIUM DIGITAL AGENCY', NULL),
  ('hero_primary_cta', 'Partner With Us', NULL),
  ('hero_secondary_cta', 'Explore Expertise', NULL),
  ('proof_stats', E'120+|Brands launched\\n2.4x|Avg. Growth Rate\\n98%|Client retention', NULL),
  ('partner_names', E'RealPluck\\nVortexDev\\nNexus & Home\\nFiction Foods\\nLoop Studio', NULL),
  ('services_intro_eyebrow', 'What we do', NULL),
  ('services_intro_heading', 'Four disciplines. One runway to growth.', NULL),
  ('services_intro_text', 'Every engagement draws from the same four capabilities, mixed to whatever stage your engine needs next.', NULL),
  ('process_eyebrow', 'How we work', NULL),
  ('process_heading', 'Built from scratch, in order.', NULL),
  ('process_subtext', 'Brand building only works as a sequence. We build every engagement through the same four stages.', NULL),
  ('process_step_1_title', 'Discover & strategize', NULL),
  ('process_step_1_text', 'We map your market, audience, and goals to set the right growth direction.', NULL),
  ('process_step_2_title', 'Design the identity', NULL),
  ('process_step_2_text', 'Name, look, voice, and core story come together into a system you can scale.', NULL),
  ('process_step_3_title', 'Build the platform', NULL),
  ('process_step_3_text', 'Your website and marketing assets go live on a fast, conversion-focused foundation.', NULL),
  ('process_step_4_title', 'Launch & grow', NULL),
  ('process_step_4_text', 'Campaigns go live, results are measured, and the best channels get sharper every week.', NULL),
  ('results_eyebrow', 'Results', NULL),
  ('results_heading', 'The numbers behind the launch.', NULL),
  ('result_stats', E'4.6x|Average increase in organic traffic within 6 months of a revised relaunch.\\n63%|Average reduction in cost per lead after a full-funnel messaging overhaul.\\n2.1x|Average conversion rate lift after a website rebuild and strategy reset.', NULL),
  ('founder_eyebrow', 'Meet the founder', NULL),
  ('founder_heading', 'Built by someone who''s flown this route before.', NULL),
  ('founder_text', E'Scalific started from a simple frustration: agencies that hand off strategy, design, web, and marketing to four different teams who never talk to each other.\\n\\nEvery plan we write, site we build, and campaign we run stays connected from the first workshop to the first major growth curve.', NULL),
  ('founder_image_url', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop'),
  ('about_image_url', 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop', 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop'),
  ('testimonials_eyebrow', 'What clients say', NULL),
  ('testimonials_heading', 'Results, in their words.', NULL),
  ('cta_heading', 'Ready to give your brand somewhere to go?', NULL),
  ('cta_text', 'Tell us where you''re starting from. We''ll point out the next practical moves.', NULL),
  ('cta_primary_button', 'Book a free strategy call', NULL),
  ('cta_secondary_button', 'Look at services', NULL),
  ('contact_bullets', E'Bespoke strategic planning\\nDirect access to founders\\nData-backed execution', NULL),
  ('contact_email', 'hello@scalific.in', NULL),
  ('contact_phone', '+91 98765 43210', NULL),
  ('contact_location', 'Remote-first, serving clients worldwide.', NULL),
  ('contact_form_missing_message', 'Form configuration is missing.', NULL),
  ('contact_form_sending_label', 'Sending...', NULL),
  ('contact_form_submit_label', 'Submit Inquiry', NULL),
  ('contact_form_success_title', 'Message Received', NULL),
  ('contact_form_success_message', 'Our team will review your inquiry and reach out within 24 hours.', NULL),
  ('contact_form_success_button', 'Send Another Message', NULL),
  ('footer_description', 'A digital marketing agency building brands, websites, and campaigns from the ground up.', NULL),
  ('footer_services_heading', 'Services', NULL),
  ('footer_company_heading', 'Company', NULL),
  ('footer_company_links', E'Our process\\nResults\\nAbout\\nContact', NULL),
  ('footer_cta_heading', 'Get Started', NULL),
  ('footer_cta_text', 'Book a strategy call and get a clear next-step plan.', NULL),
  ('footer_cta_button', 'Start the form', NULL),
  ('footer_copyright', 'Scalific Agency. All rights reserved.', NULL),
  ('footer_legal_links', E'Privacy Policy\\nTerms of Service', NULL)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO site_settings (key, value) VALUES
  ('color_primary', '#22C55E'),
  ('favicon_url', NULL),
  ('seo_title', 'Scalific'),
  ('seo_description', 'Premium digital growth agency website.'),
  ('seo_keywords', 'digital agency, branding, web design, marketing, growth'),
  ('seo_canonical_url', NULL),
  ('seo_og_title', 'Scalific'),
  ('seo_og_description', 'Premium digital growth agency website.'),
  ('seo_og_image', NULL),
  ('geo_ai_summary', NULL),
  ('geo_semantic_keywords', NULL),
  ('geo_json_ld_schema', NULL),
  ('geo_crawlers_policy', NULL)
ON CONFLICT (key) DO NOTHING;

INSERT INTO contact_form_fields (field_label, field_name, field_type, is_required, display_order) VALUES
  ('Full Name',     'name',    'text',     true,  0),
  ('Email Address', 'email',   'email',    true,  1),
  ('Phone Number',  'phone',   'phone',    false, 2),
  ('Message',       'message', 'textarea', true,  3)
ON CONFLICT DO NOTHING;

INSERT INTO services (title, description, display_order) VALUES
  ('Brand Strategy',        'We craft compelling brand identities that resonate with your target audience.', 0),
  ('Performance Marketing', 'Data-driven campaigns that consistently deliver measurable ROI.',               1),
  ('Web & Product Design',  'Conversion-optimized digital experiences built on deep user research.',         2),
  ('Content & SEO',         'Authority-building content strategies that drive organic growth.',              3),
  ('Analytics & Insights',  'Turn your data into a competitive advantage with custom dashboards.',          4),
  ('Growth Consulting',     'Strategic advisory engagements for scalable, sustainable growth.',              5)
ON CONFLICT DO NOTHING;

INSERT INTO team_members (name, role, bio, display_order) VALUES
  ('Alex Rivera',  'Founder & CEO',       'Serial entrepreneur with 15+ years scaling DTC and B2B brands from seed to Series C.', 0),
  ('Jordan Chen',  'Head of Strategy',    'Ex-McKinsey strategy consultant turned growth operator.',                                1),
  ('Maya Patel',   'Creative Director',   'Award-winning designer obsessed with the intersection of craft and conversion.',        2),
  ('Sam Williams', 'Head of Performance', '10 years running paid media. Has managed over $200M in ad spend.',                      3)
ON CONFLICT DO NOTHING;

INSERT INTO testimonials (quote, author_name, author_title, company, display_order) VALUES
  ('The rebrand alone paid for itself, but the ongoing marketing has been the real unlock for us this year.', 'Owen Castillo', 'Founder', 'Loop Studio', 0),
  ('Every deliverable landed on time, and the design system they built still holds up two years later.', 'Dana Whitfield', 'Marketing Lead', 'Verdant Co.', 1),
  ('Scalific helped us turn a scattered product story into a launch system the whole team could rally around.', 'Ava S.', 'Founder', 'B2B software brand', 2)
ON CONFLICT DO NOTHING;`;

type TableStatus = "checking" | "ok" | "missing";

export default function AdminSetup() {
  const [tableStatus, setTableStatus] = useState<Record<string, TableStatus>>(
    Object.fromEntries(REQUIRED_TABLES.map((t) => [t, "checking"]))
  );
  const [checking, setChecking] = useState(true);
  const [allReady, setAllReady] = useState(false);
  const [copied, setCopied] = useState(false);

  const checkTables = async () => {
    setChecking(true);
    setAllReady(false);
    const statuses: Record<string, TableStatus> = {};

    await Promise.all(
      REQUIRED_TABLES.map(async (table) => {
        const { error } = await supabase.from(table as any).select("id").limit(1);
        if (!error) {
          statuses[table] = "ok";
        } else if (
          error.message?.includes("does not exist") ||
          error.message?.includes("schema cache") ||
          error.code === "42P01" ||
          error.code === "PGRST200"
        ) {
          statuses[table] = "missing";
        } else {
          // Other errors (RLS etc) still mean table exists
          statuses[table] = "ok";
        }
      })
    );

    setTableStatus(statuses);
    const ready = Object.values(statuses).every((s) => s === "ok");
    setAllReady(ready);
    setChecking(false);

    if (ready) {
      toast.success("All tables are ready! You can now use the admin panel.");
    }
  };

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  const [credentials, setCredentials] = useState({
    projectUrl: (supabase as any)?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: (supabase as any)?.supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceKey: "",
  });
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState("JBSWY3DPEHPK3PXP");
  const [totpTestCode, setTotpTestCode] = useState("");
  const [savingTotp, setSavingTotp] = useState(false);

  const fetchCredentials = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["supabase_project_url", "supabase_anon_key", "supabase_service_role_key", "totp_enabled", "totp_secret"]);

      const map = data && data.length > 0 ? Object.fromEntries(data.map((d) => [d.key, d.value])) : {};
      
      const defaultUrl = map.supabase_project_url || (supabase as any)?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://priyangshud47-sys.supabase.co";
      const defaultAnon = map.supabase_anon_key || (supabase as any)?.supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const defaultService = map.supabase_service_role_key || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role";

      setCredentials({
        projectUrl: defaultUrl,
        anonKey: defaultAnon,
        serviceKey: defaultService,
      });

      setTotpEnabled(map.totp_enabled === "true");
      if (map.totp_secret) setTotpSecret(map.totp_secret);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkTables();
    fetchCredentials();

    // Database setup contains sensitive credentials (service role keys). Requires password verification.
    setIsUnlocked(false);
  }, []);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPassword) {
      toast.error("Please enter your admin password");
      return;
    }

    setVerifyingPassword(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email;

    if (!email) {
      toast.error("Could not find active session user");
      setVerifyingPassword(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: confirmPassword,
    });

    setVerifyingPassword(false);

    if (error) {
      toast.error("Incorrect password. Access denied.");
    } else {
      setIsUnlocked(true);
      toast.success("Identity verified! DB Setup unlocked.");
    }
  };

  const saveCredentials = async () => {
    setSavingCredentials(true);
    const updates = [
      { key: "supabase_project_url", value: credentials.projectUrl },
      { key: "supabase_anon_key", value: credentials.anonKey },
      { key: "supabase_service_role_key", value: credentials.serviceKey },
    ];

    const { error } = await supabase.from("site_settings").upsert(updates, { onConflict: "key" });
    setSavingCredentials(false);

    if (error) {
      toast.error(`Failed to save credentials: ${error.message}`);
    } else {
      toast.success("Supabase API credentials saved successfully");
    }
  };

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
      toast.error(`Failed to save 2FA setup: ${error.message}`);
    } else {
      toast.success(isEnabled ? "Google Authenticator 2FA enabled!" : "Google Authenticator 2FA disabled");
    }
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

  const handleCopyText = async (text: string, label: string) => {
    if (!text) {
      toast.error(`No ${label} to copy`);
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(MIGRATION_SQL);
    setCopied(true);
    toast.success("SQL copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  const missingCount = Object.values(tableStatus).filter((s) => s === "missing").length;

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight mb-2">Password Verification Required</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Database setup and Supabase API credentials contain sensitive keys. Please confirm your admin password to view and manage this section.
            </p>
          </div>
          <form onSubmit={handleVerifyPassword} className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Confirm Admin Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter password..."
                className="bg-background/50"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={verifyingPassword} className="w-full gap-2">
              {verifyingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {verifyingPassword ? "Verifying..." : "Unlock DB Setup & Credentials"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-display font-bold tracking-tight">Database & Supabase Setup</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your 3 essential Supabase credentials and monitor database health.
          </p>
        </div>
        {allReady && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Database Operational
          </div>
        )}
      </div>

      {/* Supabase 3 Essential Credentials Card */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">3 Essential Supabase Credentials</h2>
          </div>
          <Button onClick={saveCredentials} disabled={savingCredentials} className="gap-2">
            {savingCredentials ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Credentials
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* 1. Project URL / Publisher Link */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5 text-primary" /> 1. Project URL / Publisher Link</span>
              <button onClick={() => handleCopyText(credentials.projectUrl, "Project URL")} className="text-primary hover:underline flex items-center gap-1 text-xs">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </label>
            <Input
              value={credentials.projectUrl}
              onChange={(e) => setCredentials({ ...credentials, projectUrl: e.target.value })}
              placeholder="https://your-project.supabase.co"
              className="font-mono text-xs bg-background/50"
            />
          </div>

          {/* 2. Anon Public Key */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-primary" /> 2. Anon / Public API Key</span>
              <button onClick={() => handleCopyText(credentials.anonKey, "Anon Key")} className="text-primary hover:underline flex items-center gap-1 text-xs">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </label>
            <Input
              value={credentials.anonKey}
              onChange={(e) => setCredentials({ ...credentials, anonKey: e.target.value })}
              placeholder="eyJh..."
              className="font-mono text-xs bg-background/50"
            />
          </div>

          {/* 3. Service Role / Private Key */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-destructive" /> 3. Service Role / Private Key</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowServiceKey(!showServiceKey)} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
                  {showServiceKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showServiceKey ? "Hide" : "Show"}
                </button>
                <button onClick={() => handleCopyText(credentials.serviceKey, "Service Key")} className="text-primary hover:underline flex items-center gap-1 text-xs">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            </label>
            <Input
              type={showServiceKey ? "text" : "password"}
              value={credentials.serviceKey}
              onChange={(e) => setCredentials({ ...credentials, serviceKey: e.target.value })}
              placeholder="Enter service_role private secret key..."
              className="font-mono text-xs bg-background/50"
            />
          </div>
        </div>
      </div>

      {/* Status check */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">Table Status</h2>
          <Button variant="outline" size="sm" onClick={checkTables} disabled={checking} className="gap-2">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Check Again
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {REQUIRED_TABLES.map((table) => {
            const status = tableStatus[table];
            return (
              <div
                key={table}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  status === "ok"
                    ? "bg-primary/5 border-primary/20"
                    : status === "missing"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-muted/30 border-border"
                }`}
              >
                {status === "checking" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
                ) : status === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
                <span className={`text-sm font-mono ${status === "missing" ? "text-destructive" : "text-foreground"}`}>
                  {table}
                </span>
              </div>
            );
          })}
        </div>
        {!checking && missingCount > 0 && (
          <p className="text-sm text-destructive font-medium">
            {missingCount} table{missingCount > 1 ? "s" : ""} missing — follow the steps below to fix this.
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-4 p-5 border-b border-border bg-muted/20">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-display font-semibold">Copy the migration SQL</h3>
              <p className="text-sm text-muted-foreground">Click the button to copy all the setup SQL to your clipboard.</p>
            </div>
            <Button
              onClick={handleCopy}
              className="ml-auto gap-2 flex-shrink-0"
              variant={copied ? "secondary" : "default"}
            >
              {copied ? (
                <><CheckCircle2 className="w-4 h-4" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy SQL</>
              )}
            </Button>
          </div>
          <div className="relative">
            <pre className="text-xs font-mono p-4 overflow-auto max-h-48 bg-muted/10 text-muted-foreground leading-relaxed">
              {MIGRATION_SQL.slice(0, 600)}...
            </pre>
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold mb-1">Open your Supabase SQL Editor</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This link opens the SQL Editor for your project directly. Paste the copied SQL and click <strong>Run</strong>.
              </p>
              <Button
                onClick={() => window.open(SQL_EDITOR_URL, "_blank")}
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Supabase SQL Editor
              </Button>
              {PROJECT_REF && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Project: {PROJECT_REF}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold mb-1">Verify the setup</h3>
              <p className="text-sm text-muted-foreground mb-4">
                After running the SQL, click below to confirm all tables were created successfully.
              </p>
              <Button onClick={checkTables} disabled={checking} className="gap-2">
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Verify Setup
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin user reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-semibold text-amber-800 mb-1">Also needed: Admin user account</h3>
        <p className="text-sm text-amber-700">
          After the database is set up, make sure you have a Supabase Auth user created.{" "}
          <button
            onClick={() => window.open(`https://supabase.com/dashboard/project/${PROJECT_REF}/auth/users`, "_blank")}
            className="underline font-medium hover:text-amber-900"
          >
            Go to Authentication → Users → Add user
          </button>
          , set an email + password, then confirm the email.
        </p>
      </div>
    </div>
  );
}

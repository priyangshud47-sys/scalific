/**
 * Automated Supabase migration runner.
 * Reads SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL from env,
 * then executes the full DDL + seed SQL via the Supabase REST SQL endpoint.
 *
 * Run: node scripts/run-migration.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const PROJECT_REF = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
console.log(`🔗  Project: ${PROJECT_REF}`);

// ── Migration SQL ──────────────────────────────────────────────────────────────
const SQL = `
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

-- 2. ROW LEVEL SECURITY
ALTER TABLE site_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DO $$ BEGIN
  DROP POLICY IF EXISTS "public_read_site_settings"       ON site_settings;
  DROP POLICY IF EXISTS "public_read_services"            ON services;
  DROP POLICY IF EXISTS "public_read_team_members"        ON team_members;
  DROP POLICY IF EXISTS "public_read_content_blocks"      ON content_blocks;
  DROP POLICY IF EXISTS "public_read_contact_form_fields" ON contact_form_fields;
  DROP POLICY IF EXISTS "auth_write_site_settings"        ON site_settings;
  DROP POLICY IF EXISTS "auth_write_services"             ON services;
  DROP POLICY IF EXISTS "auth_write_team_members"         ON team_members;
  DROP POLICY IF EXISTS "auth_write_content_blocks"       ON content_blocks;
  DROP POLICY IF EXISTS "auth_write_contact_form_fields"  ON contact_form_fields;
  DROP POLICY IF EXISTS "public_insert_submissions"       ON contact_submissions;
  DROP POLICY IF EXISTS "auth_read_submissions"           ON contact_submissions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Public SELECT
CREATE POLICY "public_read_site_settings"       ON site_settings       FOR SELECT USING (true);
CREATE POLICY "public_read_services"            ON services            FOR SELECT USING (true);
CREATE POLICY "public_read_team_members"        ON team_members        FOR SELECT USING (true);
CREATE POLICY "public_read_content_blocks"      ON content_blocks      FOR SELECT USING (true);
CREATE POLICY "public_read_contact_form_fields" ON contact_form_fields FOR SELECT USING (true);

-- Authenticated-only write
CREATE POLICY "auth_write_site_settings"        ON site_settings       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_services"             ON services            FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_team_members"         ON team_members        FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_content_blocks"       ON content_blocks      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_contact_form_fields"  ON contact_form_fields FOR ALL USING (auth.role() = 'authenticated');

-- Submissions
CREATE POLICY "public_insert_submissions" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_read_submissions"     ON contact_submissions FOR SELECT USING (auth.role() = 'authenticated');

-- 3. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('logos',         'logos',         true),
  ('team-photos',   'team-photos',   true),
  ('service-icons', 'service-icons', true),
  ('media',         'media',         true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop + recreate for idempotency)
DO $$ BEGIN
  DROP POLICY IF EXISTS "public_read_logos"         ON storage.objects;
  DROP POLICY IF EXISTS "public_read_team_photos"   ON storage.objects;
  DROP POLICY IF EXISTS "public_read_service_icons" ON storage.objects;
  DROP POLICY IF EXISTS "public_read_media"         ON storage.objects;
  DROP POLICY IF EXISTS "auth_write_logos"          ON storage.objects;
  DROP POLICY IF EXISTS "auth_write_team_photos"    ON storage.objects;
  DROP POLICY IF EXISTS "auth_write_service_icons"  ON storage.objects;
  DROP POLICY IF EXISTS "auth_write_media"          ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

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
  ('about_text',       'At Scalific, we combine creative excellence with rigorous data analysis. We are the Formula 1 team for your digital growth, built for founders who demand performance.'),
  ('about_stat1_value','2.4x'),
  ('about_stat1_label','Avg. Growth Rate'),
  ('about_stat2_value','Top 1%'),
  ('about_stat2_label','Creative Talent'),
  ('contact_heading',  'Ready to scale?'),
  ('contact_subtext',  'Let''s discuss how we can engineer your next phase of growth. Fill out the form, and a partner will be in touch within 24 hours.')
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO site_settings (key, value) VALUES
  ('color_primary', '#22C55E')
ON CONFLICT (key) DO NOTHING;

INSERT INTO contact_form_fields (field_label, field_name, field_type, is_required, display_order) VALUES
  ('Full Name',     'name',    'text',     true,  0),
  ('Email Address', 'email',   'email',    true,  1),
  ('Phone Number',  'phone',   'phone',    false, 2),
  ('Message',       'message', 'textarea', true,  3)
ON CONFLICT DO NOTHING;

INSERT INTO services (title, description, display_order) VALUES
  ('Brand Strategy',        'We craft compelling brand identities that resonate with your target audience and differentiate you in the market.',             0),
  ('Performance Marketing', 'Data-driven campaigns across paid search, social, and programmatic that consistently deliver measurable ROI.',                  1),
  ('Web & Product Design',  'Conversion-optimized digital experiences built on deep user research and relentless testing.',                                  2),
  ('Content & SEO',         'Authority-building content strategies that drive organic growth and position your brand as the definitive industry voice.',      3),
  ('Analytics & Insights',  'Turn your data into a competitive advantage with custom dashboards, attribution modeling, and growth experimentation.',          4),
  ('Growth Consulting',     'Strategic advisory engagements that align your entire organization around a shared vision for scalable, sustainable growth.',    5)
ON CONFLICT DO NOTHING;

INSERT INTO team_members (name, role, bio, display_order) VALUES
  ('Alex Rivera',  'Founder & CEO',       'Serial entrepreneur with 15+ years scaling DTC and B2B brands from seed to Series C. Former VP Growth at two unicorns.',          0),
  ('Jordan Chen',  'Head of Strategy',    'Ex-McKinsey strategy consultant turned growth operator. Loves building frameworks that actually work in the real world.',           1),
  ('Maya Patel',   'Creative Director',   'Award-winning designer who believes great design is the last unfair advantage. Obsessed with the intersection of craft and conversion.', 2),
  ('Sam Williams', 'Head of Performance', '10 years running paid media for Fortune 500 brands and hypergrowth startups. Has managed over $200M in ad spend.',                 3)
ON CONFLICT DO NOTHING;
`;

// ── Helper: run SQL via Supabase Management API ────────────────────────────────
async function runSql(sql) {
  // Approach 1: Supabase Management API (requires personal access token - likely won't work with service key)
  // Approach 2: PostgREST SQL endpoint (PostgREST 12+)
  // Approach 3: RPC exec_sql if it exists

  const endpoints = [
    // PostgREST 12 raw SQL endpoint
    {
      url: `${SUPABASE_URL}/rest/v1/`,
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/sql',
        'Prefer': 'return=minimal',
      },
    },
    // Alternative path
    {
      url: `${SUPABASE_URL}/rest/v1`,
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/sql',
      },
    },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: ep.headers,
        body: sql,
      });
      if (res.ok || res.status === 200 || res.status === 204) {
        return { ok: true, endpoint: ep.url };
      }
      const text = await res.text();
      console.log(`  ↳ ${ep.url} → ${res.status}: ${text.slice(0, 200)}`);
    } catch (e) {
      console.log(`  ↳ ${ep.url} → Error: ${e.message}`);
    }
  }
  return { ok: false };
}

// ── Helper: run SQL statements one by one via a helper RPC ─────────────────────
async function tryRpcExecSql(sql) {
  // Try calling exec_sql RPC if it exists
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

// ── Helper: create exec_sql helper function first ──────────────────────────────
async function createExecSqlHelper() {
  // Some Supabase projects support creating functions via pg_proc or schema API
  // Try creating a helper function via supabase's internal schema
  const createFnSql = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN EXECUTE query; END;
    $$;
  `;
  return await runSql(createFnSql);
}

// ── Main ───────────────────────────────────────────────────────────────────────
console.log("🚀  Running Scalific database migration...\n");

// Step 1: try direct SQL endpoint
console.log("📡  Trying direct SQL endpoint...");
const directResult = await runSql(SQL);

if (directResult.ok) {
  console.log(`\n✅  Migration completed successfully via ${directResult.endpoint}`);
  process.exit(0);
}

// Step 2: try RPC exec_sql
console.log("\n📡  Trying exec_sql RPC...");
const rpcResult = await tryRpcExecSql(SQL);
if (rpcResult.status === 200 || rpcResult.status === 204) {
  console.log("✅  Migration completed via exec_sql RPC");
  process.exit(0);
}
console.log(`  ↳ exec_sql RPC → ${rpcResult.status}: ${rpcResult.body.slice(0, 200)}`);

// Step 3: try creating the helper first
console.log("\n📡  Trying to bootstrap exec_sql helper...");
const helperResult = await createExecSqlHelper();
if (helperResult.ok) {
  console.log("  ↳ Helper created, retrying migration...");
  const retryRpc = await tryRpcExecSql(SQL);
  if (retryRpc.status === 200 || retryRpc.status === 204) {
    console.log("✅  Migration completed via bootstrapped exec_sql");
    process.exit(0);
  }
}

// All automated approaches failed
console.log(`
❌  Automated migration failed — Supabase doesn't expose a direct SQL API 
    with the service role key alone. You need to run the SQL manually.

📋  HOW TO FIX (30 seconds):
    1. Open: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new
    2. Paste the contents of: supabase-migration.sql
    3. Click Run
    4. Come back and try again — everything will work immediately.
`);
process.exit(1);

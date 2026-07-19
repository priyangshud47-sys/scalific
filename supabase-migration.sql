-- ============================================================
-- Scalific — Supabase Migration
-- Run this in your Supabase SQL Editor (dashboard.supabase.com)
-- ============================================================

-- 1. TABLES ---------------------------------------------------

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

-- 2. ROW LEVEL SECURITY ---------------------------------------

ALTER TABLE site_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials        ENABLE ROW LEVEL SECURITY;

-- Public SELECT
CREATE POLICY "public_read_site_settings"       ON site_settings       FOR SELECT USING (true);
CREATE POLICY "public_read_services"            ON services            FOR SELECT USING (true);
CREATE POLICY "public_read_team_members"        ON team_members        FOR SELECT USING (true);
CREATE POLICY "public_read_content_blocks"      ON content_blocks      FOR SELECT USING (true);
CREATE POLICY "public_read_contact_form_fields" ON contact_form_fields FOR SELECT USING (true);
CREATE POLICY "public_read_testimonials"         ON testimonials        FOR SELECT USING (true);

-- Authenticated-only write
CREATE POLICY "auth_write_site_settings"       ON site_settings       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_services"            ON services            FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_team_members"        ON team_members        FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_content_blocks"      ON content_blocks      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_contact_form_fields" ON contact_form_fields FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_testimonials"        ON testimonials        FOR ALL USING (auth.role() = 'authenticated');

-- Anyone can submit, only auth can read submissions
CREATE POLICY "public_insert_submissions" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_read_submissions"     ON contact_submissions FOR SELECT USING (auth.role() = 'authenticated');

-- 3. STORAGE BUCKETS ------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('logos',          'logos',          true),
  ('team-photos',    'team-photos',    true),
  ('service-icons',  'service-icons',  true),
  ('media',          'media',          true)
ON CONFLICT (id) DO NOTHING;

-- Public storage read policies
CREATE POLICY "public_read_logos"         ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "public_read_team_photos"   ON storage.objects FOR SELECT USING (bucket_id = 'team-photos');
CREATE POLICY "public_read_service_icons" ON storage.objects FOR SELECT USING (bucket_id = 'service-icons');
CREATE POLICY "public_read_media"         ON storage.objects FOR SELECT USING (bucket_id = 'media');

-- Auth write storage policies
CREATE POLICY "auth_write_logos"         ON storage.objects FOR ALL USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "auth_write_team_photos"   ON storage.objects FOR ALL USING (bucket_id = 'team-photos' AND auth.role() = 'authenticated');
CREATE POLICY "auth_write_service_icons" ON storage.objects FOR ALL USING (bucket_id = 'service-icons' AND auth.role() = 'authenticated');
CREATE POLICY "auth_write_media"         ON storage.objects FOR ALL USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- 4. SEED DATA ------------------------------------------------

-- Default content blocks
INSERT INTO content_blocks (section_key, content) VALUES
  -- Hero
  ('hero_title',       'Data-Driven Strategy.\nRelentless Execution.'),
  ('hero_subtitle',    'We turn ambitious brands into market leaders. No fluff, just results.'),
  -- Services section
  ('services_heading', 'Core Expertise'),
  ('services_subtext', 'Precision engineering for your digital presence. Every service is a focused strike on your growth targets.'),
  -- Team section
  ('team_heading',     'The A-Team'),
  ('team_subtext',     'Founders, operators, and specialists. The minds behind the execution.'),
  -- About section
  ('about_heading',    'Built for founders who demand performance.'),
  ('about_text',       'At Scalific, we combine creative excellence with rigorous data analysis. We are the Formula 1 team for your digital growth, built for founders who demand performance.'),
  ('about_stat1_value','2.4x'),
  ('about_stat1_label','Avg. Growth Rate'),
  ('about_stat2_value','Top 1%'),
  ('about_stat2_label','Creative Talent'),
  -- Contact section
  ('contact_heading',  'Ready to scale?'),
  ('contact_subtext',  'Let''s discuss how we can engineer your next phase of growth. Fill out the form, and a partner will be in touch within 24 hours.')
ON CONFLICT (section_key) DO NOTHING;

-- Extended editable homepage content blocks
INSERT INTO content_blocks (section_key, content, media_url) VALUES
  ('nav_services_label', 'Services', NULL),
  ('nav_team_label', 'Team', NULL),
  ('nav_about_label', 'About', NULL),
  ('nav_contact_label', 'Contact', NULL),
  ('nav_cta_label', 'Get Started', NULL),
  ('hero_badge', 'PREMIUM DIGITAL AGENCY', NULL),
  ('hero_primary_cta', 'Partner With Us', NULL),
  ('hero_secondary_cta', 'Explore Expertise', NULL),
  ('proof_stats', E'120+|Brands launched\n2.4x|Avg. Growth Rate\n98%|Client retention', NULL),
  ('partner_names', E'RealPluck\nVortexDev\nNexus & Home\nFiction Foods\nLoop Studio', NULL),
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
  ('result_stats', E'4.6x|Average increase in organic traffic within 6 months of a revised relaunch.\n63%|Average reduction in cost per lead after a full-funnel messaging overhaul.\n2.1x|Average conversion rate lift after a website rebuild and strategy reset.', NULL),
  ('founder_eyebrow', 'Meet the founder', NULL),
  ('founder_heading', 'Built by someone who''s flown this route before.', NULL),
  ('founder_text', E'Scalific started from a simple frustration: agencies that hand off strategy, design, web, and marketing to four different teams who never talk to each other.\n\nEvery plan we write, site we build, and campaign we run stays connected from the first workshop to the first major growth curve.', NULL),
  ('founder_image_url', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop'),
  ('about_image_url', 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop', 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop'),
  ('testimonials_eyebrow', 'What clients say', NULL),
  ('testimonials_heading', 'Results, in their words.', NULL),
  ('cta_heading', 'Ready to give your brand somewhere to go?', NULL),
  ('cta_text', 'Tell us where you''re starting from. We''ll point out the next practical moves.', NULL),
  ('cta_primary_button', 'Book a free strategy call', NULL),
  ('cta_secondary_button', 'Look at services', NULL),
  ('contact_bullets', E'Bespoke strategic planning\nDirect access to founders\nData-backed execution', NULL),
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
  ('footer_company_links', E'Our process\nResults\nAbout\nContact', NULL),
  ('footer_cta_heading', 'Get Started', NULL),
  ('footer_cta_text', 'Book a strategy call and get a clear next-step plan.', NULL),
  ('footer_cta_button', 'Start the form', NULL),
  ('footer_copyright', 'Scalific Agency. All rights reserved.', NULL),
  ('footer_legal_links', E'Privacy Policy\nTerms of Service', NULL)
ON CONFLICT (section_key) DO NOTHING;

-- Default brand color
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
  ('geo_region', NULL),
  ('geo_placename', NULL),
  ('geo_position', NULL),
  ('geo_icbm', NULL)
ON CONFLICT (key) DO NOTHING;

-- Default contact form fields
INSERT INTO contact_form_fields (field_label, field_name, field_type, is_required, display_order) VALUES
  ('Full Name',    'name',    'text',     true,  0),
  ('Email Address','email',   'email',    true,  1),
  ('Phone Number', 'phone',   'phone',    false, 2),
  ('Message',      'message', 'textarea', true,  3)
ON CONFLICT DO NOTHING;

-- Sample services
INSERT INTO services (title, description, display_order) VALUES
  ('Brand Strategy',       'We craft compelling brand identities that resonate with your target audience and differentiate you in the market.',              0),
  ('Performance Marketing','Data-driven campaigns across paid search, social, and programmatic that consistently deliver measurable ROI.',                    1),
  ('Web & Product Design', 'Conversion-optimized digital experiences built on deep user research and relentless testing.',                                     2),
  ('Content & SEO',        'Authority-building content strategies that drive organic growth and position your brand as the definitive industry voice.',       3),
  ('Analytics & Insights', 'Turn your data into a competitive advantage with custom dashboards, attribution modeling, and growth experimentation.',           4),
  ('Growth Consulting',    'Strategic advisory engagements that align your entire organization around a shared vision for scalable, sustainable growth.',     5)
ON CONFLICT DO NOTHING;

-- Sample team members
INSERT INTO team_members (name, role, bio, display_order) VALUES
  ('Alex Rivera',   'Founder & CEO',           'Serial entrepreneur with 15+ years scaling DTC and B2B brands from seed to Series C. Former VP Growth at two unicorns.',   0),
  ('Jordan Chen',   'Head of Strategy',        'Ex-McKinsey strategy consultant turned growth operator. Loves building frameworks that actually work in the real world.',      1),
  ('Maya Patel',    'Creative Director',        'Award-winning designer who believes great design is the last unfair advantage. Obsessed with the intersection of craft and conversion.', 2),
  ('Sam Williams',  'Head of Performance',      '10 years running paid media for Fortune 500 brands and hypergrowth startups. Has managed over $200M in ad spend.',            3)
ON CONFLICT DO NOTHING;

-- Sample testimonials
INSERT INTO testimonials (quote, author_name, author_title, company, display_order) VALUES
  ('The rebrand alone paid for itself, but the ongoing marketing has been the real unlock for us this year.', 'Owen Castillo', 'Founder', 'Loop Studio', 0),
  ('Every deliverable landed on time, and the design system they built still holds up two years later.', 'Dana Whitfield', 'Marketing Lead', 'Verdant Co.', 1),
  ('Scalific helped us turn a scattered product story into a launch system the whole team could rally around.', 'Ava S.', 'Founder', 'B2B software brand', 2)
ON CONFLICT DO NOTHING;

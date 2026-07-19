"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Service, TeamMember, ContentBlock, ContactFormField, SiteSetting, Testimonial } from "@/lib/types";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Mail, MapPin, Menu, Phone, Quote, Rocket, Search, Target, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { applyBrandColor } from "@/lib/brandColor";

const logoPath = "/assets/scalific-logo.png";
const getBlockContent = (blocks: Record<string, ContentBlock>, key: string, fallback: string) => {
  return blocks[key]?.content || fallback;
};

const getBlockList = (blocks: Record<string, ContentBlock>, key: string, fallback: string[]) => {
  const content = blocks[key]?.content;
  if (!content) return fallback;
  return content
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

// Helper for dynamic icons (supports both SVG strings and Lucide names)
const ServiceIcon = ({ icon, title, className }: { icon: string | null; title: string; className?: string }) => {
  const trimmed = icon?.trim();
  if (trimmed && (trimmed.startsWith("<svg") || trimmed.startsWith("<SVG"))) {
    return (
      <div 
        className={`${className} flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full`}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  const name = icon || title.split(" ")[0] || "Activity";
  // @ts-ignore
  const IconComponent = LucideIcons[name] || LucideIcons.Activity;
  return <IconComponent className={className} />;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [contentBlocks, setContentBlocks] = useState<Record<string, ContentBlock>>({});
  const [contactFields, setContactFields] = useState<ContactFormField[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [footerLogoUrl, setFooterLogoUrl] = useState<string | null>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { scrollY, scrollYProgress } = useScroll();
  const scrollProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroY = useTransform(scrollY, [0, 1000], [0, 300]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroGlowY = useTransform(scrollY, [0, 800], [0, 140]);
  const heroGlowScale = useTransform(scrollY, [0, 800], [1, 1.18]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          servicesRes,
          teamRes,
          contentRes,
          fieldsRes,
          testimonialsRes,
          settingsRes
        ] = await Promise.all([
          supabase.from("services").select("*").eq("is_active", true).order("display_order"),
          supabase.from("team_members").select("*").eq("is_active", true).order("display_order"),
          supabase.from("content_blocks").select("*"),
          supabase.from("contact_form_fields").select("*").order("display_order"),
          supabase.from("testimonials").select("*").eq("is_active", true).order("display_order"),
          supabase.from("site_settings").select("*")
        ]);

        if (servicesRes.data) setServices(servicesRes.data);
        if (teamRes.data) setTeamMembers(teamRes.data);
        if (fieldsRes.data) setContactFields(fieldsRes.data);
        if (testimonialsRes.data) setTestimonials(testimonialsRes.data);
        
        if (contentRes.data) {
          const blocksMap: Record<string, ContentBlock> = {};
          contentRes.data.forEach(block => {
            blocksMap[block.section_key] = block;
          });
          setContentBlocks(blocksMap);
        }

        if (settingsRes.data) {
          const logoSetting = settingsRes.data.find((s: SiteSetting) => s.key === "logo_url");
          const footerLogoSetting = settingsRes.data.find((s: SiteSetting) => s.key === "footer_logo_url");
          const colorSetting = settingsRes.data.find((s: SiteSetting) => s.key === "color_primary");
          if (logoSetting?.value) setLogoUrl(logoSetting.value);
          if (footerLogoSetting?.value) setFooterLogoUrl(footerLogoSetting.value);
          if (colorSetting?.value) applyBrandColor(colorSetting.value);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="space-y-4 max-w-2xl w-full px-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-5/6" />
          <Skeleton className="h-8 w-4/6" />
        </div>
      </div>
    );
  }

  const heroBadge        = getBlockContent(contentBlocks, "hero_badge", "PREMIUM DIGITAL AGENCY");
  const heroTitle        = getBlockContent(contentBlocks, "hero_title", "Data-Driven Strategy.\\nRelentless Execution.");
  const heroSubtitle     = getBlockContent(contentBlocks, "hero_subtitle", "We turn ambitious brands into market leaders. No fluff, just results.");
  const heroPrimaryCta   = getBlockContent(contentBlocks, "hero_primary_cta", "Partner With Us");
  const heroSecondaryCta = getBlockContent(contentBlocks, "hero_secondary_cta", "Explore Expertise");
  const navItems = [
    { label: getBlockContent(contentBlocks, "nav_services_label", "Services"), target: "services" },
    { label: getBlockContent(contentBlocks, "nav_team_label", "Team"), target: "team" },
    { label: getBlockContent(contentBlocks, "nav_about_label", "About"), target: "about" },
    { label: getBlockContent(contentBlocks, "nav_contact_label", "Contact"), target: "contact" },
  ];
  const navCtaLabel = getBlockContent(contentBlocks, "nav_cta_label", "Get Started");
  const aboutText        = getBlockContent(contentBlocks, "about_text", "At Scalific, we combine creative excellence with rigorous data analysis. We are the Formula 1 team for your digital growth, built for founders who demand performance.");
  const aboutHeading     = getBlockContent(contentBlocks, "about_heading", "Built for founders who demand performance.");
  const aboutImageUrl    = contentBlocks["about_image_url"]?.media_url || getBlockContent(contentBlocks, "about_image_url", "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop");
  const aboutStat1Val    = getBlockContent(contentBlocks, "about_stat1_value", "2.4x");
  const aboutStat1Label  = getBlockContent(contentBlocks, "about_stat1_label", "Avg. Growth Rate");
  const aboutStat2Val    = getBlockContent(contentBlocks, "about_stat2_value", "Top 1%");
  const aboutStat2Label  = getBlockContent(contentBlocks, "about_stat2_label", "Creative Talent");
  const servicesHeading  = getBlockContent(contentBlocks, "services_heading", "Core Expertise");
  const servicesSubtext  = getBlockContent(contentBlocks, "services_subtext", "Precision engineering for your digital presence. Every service is a focused strike on your growth targets.");
  const servicesIntroEyebrow = getBlockContent(contentBlocks, "services_intro_eyebrow", "What we do");
  const servicesIntroHeading = getBlockContent(contentBlocks, "services_intro_heading", "Four disciplines. One runway to growth.");
  const servicesIntroText = getBlockContent(contentBlocks, "services_intro_text", "Every engagement draws from the same four capabilities, mixed to whatever stage your engine needs next.");
  const teamHeading      = getBlockContent(contentBlocks, "team_heading", "The A-Team");
  const teamSubtext      = getBlockContent(contentBlocks, "team_subtext", "Founders, operators, and specialists. The minds behind the execution.");
  const processEyebrow   = getBlockContent(contentBlocks, "process_eyebrow", "How we work");
  const processHeading   = getBlockContent(contentBlocks, "process_heading", "Built from scratch, in order.");
  const processSubtext   = getBlockContent(contentBlocks, "process_subtext", "Brand building only works as a sequence. We build every engagement through the same four stages.");
  const resultsEyebrow   = getBlockContent(contentBlocks, "results_eyebrow", "Results");
  const resultsHeading   = getBlockContent(contentBlocks, "results_heading", "The numbers behind the launch.");
  const founderEyebrow   = getBlockContent(contentBlocks, "founder_eyebrow", "Meet the founder");
  const founderHeading   = getBlockContent(contentBlocks, "founder_heading", "Built by someone who's flown this route before.");
  const founderText      = getBlockContent(contentBlocks, "founder_text", "Scalific started from a simple frustration: agencies that hand off strategy, design, web, and marketing to four different teams who never talk to each other.\n\nEvery plan we write, site we build, and campaign we run stays connected from the first workshop to the first major growth curve.");
  const founderFallbackImage = contentBlocks["founder_image_url"]?.media_url || getBlockContent(contentBlocks, "founder_image_url", "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop");
  const testimonialsEyebrow = getBlockContent(contentBlocks, "testimonials_eyebrow", "What clients say");
  const testimonialsHeading = getBlockContent(contentBlocks, "testimonials_heading", "Results, in their words.");
  const ctaHeading = getBlockContent(contentBlocks, "cta_heading", "Ready to give your brand somewhere to go?");
  const ctaText = getBlockContent(contentBlocks, "cta_text", "Tell us where you're starting from. We'll point out the next practical moves.");
  const ctaPrimary = getBlockContent(contentBlocks, "cta_primary_button", "Book a free strategy call");
  const ctaSecondary = getBlockContent(contentBlocks, "cta_secondary_button", "Look at services");
  const contactHeading   = getBlockContent(contentBlocks, "contact_heading", "Ready to scale?");
  const contactSubtext   = getBlockContent(contentBlocks, "contact_subtext", "Let's discuss how we can engineer your next phase of growth. Fill out the form, and a partner will be in touch within 24 hours.");
  const contactEmail     = getBlockContent(contentBlocks, "contact_email", "hello@scalific.in");
  const contactPhone     = getBlockContent(contentBlocks, "contact_phone", "+91 98765 43210");
  const contactLocation  = getBlockContent(contentBlocks, "contact_location", "Remote-first, serving clients worldwide.");
  const contactFormCopy = {
    missing: getBlockContent(contentBlocks, "contact_form_missing_message", "Form configuration is missing."),
    sending: getBlockContent(contentBlocks, "contact_form_sending_label", "Sending..."),
    submit: getBlockContent(contentBlocks, "contact_form_submit_label", "Submit Inquiry"),
    successButton: getBlockContent(contentBlocks, "contact_form_success_button", "Send Another Message"),
    successMessage: getBlockContent(contentBlocks, "contact_form_success_message", "Our team will review your inquiry and reach out within 24 hours."),
    successTitle: getBlockContent(contentBlocks, "contact_form_success_title", "Message Received"),
  };
  const footerDescription = getBlockContent(contentBlocks, "footer_description", "A digital marketing agency building brands, websites, and campaigns from the ground up.");
  const footerServicesHeading = getBlockContent(contentBlocks, "footer_services_heading", "Services");
  const footerCompanyHeading = getBlockContent(contentBlocks, "footer_company_heading", "Company");
  const footerCompanyLinks = getBlockList(contentBlocks, "footer_company_links", ["Our process", "Results", "About", "Contact"]);
  const footerCtaHeading = getBlockContent(contentBlocks, "footer_cta_heading", "Get Started");
  const footerCtaText = getBlockContent(contentBlocks, "footer_cta_text", "Book a strategy call and get a clear next-step plan.");
  const footerCtaButton = getBlockContent(contentBlocks, "footer_cta_button", "Start the form");
  const footerCopyright = getBlockContent(contentBlocks, "footer_copyright", "Scalific Agency. All rights reserved.");
  const footerLegalLinks = getBlockList(contentBlocks, "footer_legal_links", ["Privacy Policy", "Terms of Service"]);

  const finalLogo = logoUrl || logoPath;
  const finalFooterLogo = footerLogoUrl || "/assets/scalific-footer-logo.svg";
  const defaultTestimonials: Testimonial[] = [
    {
      id: "default-1",
      quote: "The rebrand alone paid for itself, but the ongoing marketing has been the real unlock for us this year.",
      author_name: "Owen Castillo",
      author_title: "Founder",
      company: "Loop Studio",
      display_order: 0,
      is_active: true,
      created_at: "",
    },
    {
      id: "default-2",
      quote: "Every deliverable landed on time, and the design system they built still holds up two years later.",
      author_name: "Dana Whitfield",
      author_title: "Marketing Lead",
      company: "Verdant Co.",
      display_order: 1,
      is_active: true,
      created_at: "",
    },
    {
      id: "default-3",
      quote: "Scalific helped us turn a scattered product story into a launch system the whole team could rally around.",
      author_name: "Ava S.",
      author_title: "Founder",
      company: "B2B software brand",
      display_order: 2,
      is_active: true,
      created_at: "",
    },
  ];
  const testimonialItems = testimonials.length > 0 ? testimonials : defaultTestimonials;
  const visibleTestimonials = [
    testimonialItems[testimonialIndex % testimonialItems.length],
    testimonialItems[(testimonialIndex + 1) % testimonialItems.length],
  ].filter(Boolean);
  const goToPreviousTestimonial = () => {
    setTestimonialIndex((current) => (current - 1 + testimonialItems.length) % testimonialItems.length);
  };
  const goToNextTestimonial = () => {
    setTestimonialIndex((current) => (current + 1) % testimonialItems.length);
  };
  const founder = teamMembers[0];
  const proofStats = getBlockList(contentBlocks, "proof_stats", [
    "120+|Brands launched",
    `${aboutStat1Val}|${aboutStat1Label}`,
    "98%|Client retention",
  ]).map((item) => {
    const [value, label] = item.split("|");
    return { value: value || "", label: label || "" };
  });
  const partnerLogos = getBlockList(contentBlocks, "partner_names", ["RealPluck", "VortexDev", "Nexus & Home", "Fiction Foods", "Loop Studio"]);
  const processSteps = [
    {
      icon: Search,
      title: getBlockContent(contentBlocks, "process_step_1_title", "Discover & strategize"),
      text: getBlockContent(contentBlocks, "process_step_1_text", "We map your market, audience, and goals to set the right growth direction."),
    },
    {
      icon: Target,
      title: getBlockContent(contentBlocks, "process_step_2_title", "Design the identity"),
      text: getBlockContent(contentBlocks, "process_step_2_text", "Name, look, voice, and core story come together into a system you can scale."),
    },
    {
      icon: Rocket,
      title: getBlockContent(contentBlocks, "process_step_3_title", "Build the platform"),
      text: getBlockContent(contentBlocks, "process_step_3_text", "Your website and marketing assets go live on a fast, conversion-focused foundation."),
    },
    {
      icon: BarChart3,
      title: getBlockContent(contentBlocks, "process_step_4_title", "Launch & grow"),
      text: getBlockContent(contentBlocks, "process_step_4_text", "Campaigns go live, results are measured, and the best channels get sharper every week."),
    },
  ];
  const resultStats = getBlockList(contentBlocks, "result_stats", [
    "4.6x|Average increase in organic traffic within 6 months of a revised relaunch.",
    "63%|Average reduction in cost per lead after a full-funnel messaging overhaul.",
    "2.1x|Average conversion rate lift after a website rebuild and strategy reset.",
  ]).map((item) => {
    const [value, label] = item.split("|");
    return { value: value || "", label: label || "" };
  });
  const contactBullets = getBlockList(contentBlocks, "contact_bullets", [
    "Bespoke strategic planning",
    "Direct access to founders",
    "Data-backed execution",
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      <motion.div
        style={{ scaleX: scrollProgress }}
        className="fixed top-0 left-0 right-0 h-1 origin-left bg-gradient-to-r from-primary via-primary-via to-primary-dark z-[60]"
      />

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md border-b border-border py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); scrollTo("hero"); }} className="relative z-10 flex items-center gap-2 group">
            <img src={finalLogo} alt="Scalific" className="h-12 md:h-14 w-auto object-contain transition-transform group-hover:scale-105" />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.target}
                onClick={() => scrollTo(item.target)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
            <Button onClick={() => scrollTo("contact")} className="font-semibold tracking-wide">
              {navCtaLabel}
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden relative z-10 text-foreground p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        <motion.div
          initial={false}
          animate={{ height: mobileMenuOpen ? "auto" : 0, opacity: mobileMenuOpen ? 1 : 0 }}
          className="md:hidden overflow-hidden bg-white/98 backdrop-blur-xl absolute top-full left-0 right-0 border-b border-border shadow-md"
        >
          <nav className="flex flex-col p-6 gap-6 items-center">
            {navItems.map((item) => (
              <button
                key={item.target}
                onClick={() => scrollTo(item.target)}
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
            <Button onClick={() => scrollTo("contact")} className="w-full mt-4">
              {navCtaLabel}
            </Button>
          </nav>
        </motion.div>
      </header>

      <main>
        {/* Hero Section */}
        <section id="hero" className="relative min-h-[100dvh] flex items-center pt-24 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 z-0">
            <motion.div
              style={{ y: heroGlowY, scale: heroGlowScale }}
              className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-60"
            />
            <motion.div
              style={{ y: heroGlowY, scale: heroGlowScale }}
              className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-50 bg-[var(--primary-glow)]"
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              style={{ y: heroY, opacity: heroOpacity }}
              className="max-w-5xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <span className="inline-block py-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-wider mb-6">
                  {heroBadge}
                </span>
                <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-8">
                  {heroTitle.split('\\n').map((line, i, arr) => (
                    <React.Fragment key={i}>
                      {line}
                      {i !== arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 font-light">
                  {heroSubtitle}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="h-14 px-8 text-base shadow-[0_0_40px_-10px_var(--primary-shadow)] group" onClick={() => scrollTo("contact")}>
                    {heroPrimaryCta}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border hover:bg-muted" onClick={() => scrollTo("services")}>
                    {heroSecondaryCta}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Proof Strip */}
        <section className="py-10 bg-white border-y border-border">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center"
            >
              <div className="grid grid-cols-3 gap-4">
                {proofStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="font-display text-2xl md:text-3xl font-bold text-[#181B20]">{stat.value}</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {partnerLogos.map((partner) => (
                  <span key={partner}>{partner}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-32 relative bg-background border-t border-border">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="mb-20"
            >
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {servicesHeading.includes(" ") ? (
                  <>
                    {servicesHeading.split(" ").slice(0, -1).join(" ")}{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">
                      {servicesHeading.split(" ").slice(-1)[0]}
                    </span>
                  </>
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">{servicesHeading}</span>
                )}
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl">{servicesSubtext}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="mb-12 max-w-3xl"
            >
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{servicesIntroEyebrow}</span>
              <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-4">
                {servicesIntroHeading}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {servicesIntroText}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <ServiceIcon icon={service.icon_url} title={service.title} className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process + Results */}
        <section className="py-32 bg-primary-light/80 border-y border-primary-border-light">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{processEyebrow}</span>
                <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-4 mb-6 text-[#181B20]">
                  {processHeading}
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed max-w-xl">
                  {processSubtext}
                </p>

                <div className="mt-10 space-y-6">
                  {processSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.5, delay: index * 0.08 }}
                        className="flex gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-lg text-[#181B20]">{step.title}</h3>
                          <p className="text-gray-600 mt-1 leading-relaxed">{step.text}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:pt-12"
              >
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{resultsEyebrow}</span>
                <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-4 mb-8 text-[#181B20]">
                  {resultsHeading}
                </h2>
                <div className="space-y-4">
                  {resultStats.map((stat, index) => (
                    <motion.div
                      key={stat.value}
                      initial={{ opacity: 0, y: 22 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.55, delay: index * 0.1 }}
                      className="relative overflow-hidden rounded-xl bg-[#181B20] p-7 text-white shadow-xl"
                    >
                      <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-primary/30 rounded-full blur-3xl" />
                      <div className="relative z-10">
                        <div className="font-display text-4xl font-bold text-primary-via">{stat.value}</div>
                        <p className="text-sm text-white/70 mt-3 leading-relaxed">{stat.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        {teamMembers.length > 0 && (
          <section id="team" className="py-32 relative">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-20"
              >
                <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  {teamHeading.includes(" ") ? (
                    <>
                      {teamHeading.split(" ").slice(0, -1).join(" ")}{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">
                        {teamHeading.split(" ").slice(-1)[0]}
                      </span>
                    </>
                  ) : (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">{teamHeading}</span>
                  )}
                </h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">{teamSubtext}</p>
              </motion.div>

              <div className={teamMembers.length === 1 ? "flex justify-center" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"}>
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={teamMembers.length === 1 ? "group w-full max-w-sm text-center" : "group"}
                  >
                    <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-6 bg-gray-100 border border-gray-200">
                      {member.photo_url ? (
                        <img 
                          src={member.photo_url} 
                          alt={member.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-4xl font-display font-bold text-gray-400">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent opacity-80" />
                    </div>
                    <h3 className="font-display text-xl font-bold">{member.name}</h3>
                    <p className="text-primary text-sm font-medium mb-3">{member.role}</p>
                    <p className="text-muted-foreground text-sm line-clamp-3">{member.bio}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Founder Story */}
        <section className="py-32 bg-white border-y border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{founderEyebrow}</span>
                <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-4 mb-8">
                  {founderHeading}
                </h2>
                <div className="space-y-6 text-muted-foreground text-lg leading-relaxed text-left max-w-2xl mx-auto">
                  {founderText.split("\\n\\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-10 text-base font-semibold text-primary">
                  {founder?.name || "Founder"} — {founder?.role || "Scalific Founder"}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 bg-[#F4F6F5] text-[#181B20]">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-8 text-[#181B20]">
                  {aboutHeading}
                </h2>
                <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                  {aboutText.split('\\n\\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-10 grid grid-cols-2 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className="text-4xl font-display font-bold text-[#181B20] mb-2">{aboutStat1Val}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{aboutStat1Label}</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="text-4xl font-display font-bold text-[#181B20] mb-2">{aboutStat2Val}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{aboutStat2Label}</div>
                  </motion.div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-[#181B20] flex items-center justify-center">
                  <div className="absolute w-[800px] h-[800px] bg-primary/20 rounded-full blur-[100px]" />
                  <img 
                    src={aboutImageUrl}
                    alt="Abstract team collaboration"
                    className="w-full h-full object-cover opacity-80 mix-blend-luminosity"
                  />
                  <div className="absolute inset-0 border-[20px] border-[#F4F6F5]/10 rounded-3xl" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 bg-primary-light/80 border-y border-primary-border-light overflow-hidden">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                <span className="w-8 h-px bg-primary" />
                {testimonialsEyebrow}
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-5 text-[#181B20]">
                {testimonialsHeading}
              </h2>
            </motion.div>

            <div className="border-t border-primary-border-light/70 pt-14">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
                {visibleTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={`${testimonial.id}-${testimonialIndex}-${index}`}
                    initial={{ opacity: 0, x: index === 0 ? -24 : 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: index * 0.08 }}
                    className="min-h-[260px] flex flex-col justify-between"
                  >
                    <div>
                      <Quote className="w-8 h-8 text-primary mb-6" />
                      <p className="font-display text-2xl md:text-3xl font-bold leading-tight text-[#181B20]">
                        {testimonial.quote}
                      </p>
                    </div>
                    <div className="mt-10 flex items-center gap-3 text-base text-gray-600">
                      <span className="w-3 h-3 rounded-full bg-gray-600" />
                      <span>
                        <span className="font-bold text-[#181B20]">{testimonial.author_name}</span>
                        {(testimonial.author_title || testimonial.company) && " — "}
                        {[testimonial.author_title, testimonial.company].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-16 flex items-center justify-center gap-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousTestimonial}
                  className="h-12 w-12 rounded-full bg-white border-primary-border-light shadow-sm"
                  aria-label="Previous testimonial"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-3">
                  {testimonialItems.map((testimonial, index) => (
                    <button
                      key={testimonial.id}
                      type="button"
                      onClick={() => setTestimonialIndex(index)}
                      aria-label={`Show testimonial ${index + 1}`}
                      className={`h-3 rounded-full transition-all ${
                        index === testimonialIndex ? "w-8 bg-primary" : "w-3 bg-primary-via"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextTestimonial}
                  className="h-12 w-12 rounded-full bg-white border-primary-border-light shadow-sm"
                  aria-label="Next testimonial"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-primary p-8 md:p-10 text-primary-foreground flex flex-col justify-between overflow-hidden relative"
              >
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                    {ctaHeading}
                  </h2>
                  <p className="mt-4 text-white/80 leading-relaxed">
                    {ctaText}
                  </p>
                </div>
                <div className="relative z-10 mt-8 flex flex-col sm:flex-row gap-3">
                  <Button variant="secondary" onClick={() => scrollTo("contact")}>{ctaPrimary}</Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => scrollTo("services")}>
                    {ctaSecondary}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[150px] pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-5xl mx-auto bg-gray-50 border border-gray-100 rounded-3xl p-8 md:p-16 shadow-xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div>
                  <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">{contactHeading}</h2>
                  <p className="text-muted-foreground text-lg mb-10">{contactSubtext}</p>
                  
                  <div className="space-y-6 mb-10">
                    {contactBullets.map((bullet) => (
                      <div key={bullet} className="flex items-center gap-4 text-muted-foreground">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-8 border-t border-gray-200 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>{contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{contactLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md relative">
                  <DynamicContactForm fields={contactFields} copy={contactFormCopy} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 py-16 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-12 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <img src={finalFooterLogo} alt="Scalific" className="h-12 md:h-14 w-auto object-contain opacity-80 hover:opacity-100 transition-all mx-auto md:mx-0" />
              <p className="mt-5 text-sm text-gray-400 max-w-sm leading-relaxed mx-auto md:mx-0">
                {footerDescription}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">{footerServicesHeading}</h3>
              <div className="space-y-3 text-sm text-gray-400 flex flex-col items-center md:items-start">
                {services.slice(0, 4).map((service) => (
                  <button key={service.id} onClick={() => scrollTo("services")} className="hover:text-white transition-colors text-center md:text-left">
                    {service.title}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">{footerCompanyHeading}</h3>
              <div className="space-y-3 text-sm text-gray-400 flex flex-col items-center md:items-start">
                {footerCompanyLinks.map((item) => (
                  <button key={item} onClick={() => scrollTo(item === "Results" ? "services" : item.toLowerCase())} className="hover:text-white transition-colors text-center md:text-left">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">{footerCtaHeading}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4 max-w-sm mx-auto md:mx-0">{footerCtaText}</p>
              <Button onClick={() => scrollTo("contact")} className="w-full max-w-xs md:max-w-none">{footerCtaButton}</Button>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-sm text-gray-400 text-center">
            <p>&copy; {new Date().getFullYear()} {footerCopyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Contact Form Component
function DynamicContactForm({ fields, copy }: {
  fields: ContactFormField[];
  copy: {
    missing: string;
    sending: string;
    submit: string;
    successButton: string;
    successMessage: string;
    successTitle: string;
  };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Generate Zod schema dynamically
  const schemaObj: Record<string, z.ZodTypeAny> = {};
  fields.forEach(field => {
    let validator;
    if (field.field_type === "email") {
      validator = z.string().email("Invalid email address");
    } else {
      validator = z.string();
    }
    
    if (field.is_required) {
      validator = validator.min(1, "This field is required");
    } else {
      validator = validator.optional().or(z.literal(""));
    }
    
    schemaObj[field.field_name] = validator;
  });

  const formSchema = z.object(schemaObj);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: fields.reduce((acc, field) => {
      acc[field.field_name] = "";
      return acc;
    }, {} as Record<string, string>)
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contact_submissions').insert({
        data: values
      });
      
      if (error) throw error;
      
      setIsSuccess(true);
      form.reset();
      toast.success("Inquiry received. We'll be in touch shortly.");
    } catch (error) {
      console.error("Submission error", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-display font-bold mb-2">{copy.successTitle}</h3>
          <p className="text-muted-foreground">{copy.successMessage}</p>
        </div>
        <Button variant="outline" onClick={() => setIsSuccess(false)}>{copy.successButton}</Button>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed border-gray-200 rounded-xl">
        {copy.missing}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map(field => (
          <FormField
            key={field.id}
            control={form.control}
            name={field.field_name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-foreground">{field.field_label} {field.is_required && <span className="text-primary">*</span>}</FormLabel>
                <FormControl>
                  {field.field_type === "textarea" ? (
                    <Textarea 
                      placeholder={`Enter your ${field.field_label.toLowerCase()}`} 
                      className="bg-gray-50 border-gray-200 focus-visible:ring-primary min-h-[120px] resize-none"
                      {...formField} 
                    />
                  ) : field.field_type === "select" && field.options ? (
                    <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                      <SelectTrigger className="bg-gray-50 border-gray-200 focus:ring-primary">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : "text"}
                      placeholder={`Enter your ${field.field_label.toLowerCase()}`} 
                      className="bg-gray-50 border-gray-200 focus-visible:ring-primary h-12"
                      {...formField} 
                    />
                  )}
                </FormControl>
                <FormMessage className="text-destructive/80" />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-semibold tracking-wide">
          {isSubmitting ? copy.sending : copy.submit}
        </Button>
      </form>
    </Form>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Service } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Services — Scalific Digital Agency",
  description: "Explore our core disciplines: Strategy, Brand Identity, Web Development, and Growth Marketing.",
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

export default async function ServicesPage() {
  // Fetch services and content blocks from Supabase
  let services: Service[] = [];
  const contentBlocks: Record<string, string> = {};
  try {
    const [servicesRes, blocksRes] = await Promise.all([
      supabase.from("services").select("*").eq("is_active", true).order("display_order"),
      supabase.from("content_blocks").select("section_key, content")
    ]);
    if (servicesRes.data) services = servicesRes.data as Service[];
    if (blocksRes.data) {
      blocksRes.data.forEach(block => {
        if (block.section_key && block.content) {
          contentBlocks[block.section_key] = block.content;
        }
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }


  // Fallback services in case database is empty or fetch fails
  const fallbackServices = [
    {
      id: "fallback-strategy",
      title: "Discover & Strategize",
      description: "Deep research into your market, competitors, and audience to build a bulletproof positioning strategy before a single pixel is drawn.",
      icon_url: "Search"
    },
    {
      id: "fallback-brand",
      title: "Design the Identity",
      description: "Crafting premium visual identities, typography, and design systems that communicate trust and stand out in crowded markets.",
      icon_url: "Target"
    },
    {
      id: "fallback-platform",
      title: "Build the Platform",
      description: "Developing lightning-fast, conversion-optimized websites and web applications tailored for lead generation and user experience.",
      icon_url: "Rocket"
    },
    {
      id: "fallback-growth",
      title: "Launch & Grow",
      description: "Data-driven performance marketing, SEO, and continuous conversion rate optimization to scale your customer acquisition.",
      icon_url: "BarChart3"
    }
  ];

  const displayServices = services.length > 0 ? services : fallbackServices;

  const pageHeading = contentBlocks.services_page_heading || "Our Services";
  const pageText = contentBlocks.services_page_text || "We don't just build websites; we build scalable digital growth engines. Our core disciplines work in harmony to take your brand from concept to market leader.";

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">{pageHeading}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-16">
          {pageText}
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {displayServices.map((service) => (
            <div 
              key={service.id} 
              className="group relative p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <ServiceIcon icon={service.icon_url} title={service.title} className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link 
            href="/contact" 
            className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Discuss Your Project
          </Link>
        </div>
      </div>
    </main>
  );
}


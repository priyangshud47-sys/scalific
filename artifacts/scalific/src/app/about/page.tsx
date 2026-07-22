import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { TeamMember } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "About Us — Scalific Founder-Led Agency",
  description: "Scalific is a founder-led digital agency. We combine strategy, design, and marketing under one roof to build scalable brands.",
};

export default async function AboutPage() {
  // Fetch active team members and content blocks from Supabase
  let teamMembers: TeamMember[] = [];
  const contentBlocks: Record<string, string> = {};
  try {
    const [teamRes, blocksRes] = await Promise.all([
      supabase.from("team_members").select("*").eq("is_active", true).order("display_order"),
      supabase.from("content_blocks").select("section_key, content")
    ]);
    if (teamRes.data) teamMembers = teamRes.data as TeamMember[];
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

  // Fallback if database has no active team members
  const fallbackMembers = [
    {
      id: "fallback-founder",
      name: "Priyangshu Das",
      role: "Founder & Strategy Lead",
      photo_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop",
      bio: "Scalific started from a simple frustration...",
      is_active: true,
      display_order: 1
    }
  ];

  const displayMembers = teamMembers.length > 0 ? teamMembers : fallbackMembers;

  const pageHeading = contentBlocks.about_page_heading || "Built by founders, for founders.";
  const pageText = contentBlocks.about_page_text || "Scalific started from a simple frustration: agencies that hand off strategy, design, web, and marketing to four different teams who never talk to each other.";
  const integratedHeading = contentBlocks.about_integrated_heading || "The Integrated Approach";
  const integratedText = contentBlocks.about_integrated_text || "Every plan we write, site we build, and campaign we run stays connected from the first workshop to the first major growth curve. We act as your fractional growth team, ensuring that your brand narrative remains consistent across every single touchpoint.";

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">{pageHeading}</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p className="text-xl mb-8">
            {pageText}
          </p>
          
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 my-12 text-foreground">
            <h3 className="text-2xl font-bold mb-4">{integratedHeading}</h3>
            <p className="text-muted-foreground">
              {integratedText}
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground mt-12 mb-6">Meet the Team</h2>
        <div className={displayMembers.length === 1 ? "flex justify-center mb-12" : "grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12"}>
          {displayMembers.map((member) => (
            <div key={member.id} className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-100 bg-white shadow-sm text-foreground max-w-sm w-full">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 mb-4 shrink-0">
                {member.photo_url ? (
                  <img 
                    src={member.photo_url} 
                    alt={member.name} 
                    className="w-full h-full object-cover object-center" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{member.name}</h3>
                <p className="text-primary font-medium text-sm mt-1">{member.role}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-10 border-t border-border">
          <Link href="/contact" className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Work With Us
          </Link>
        </div>
      </div>
    </main>
  );
}

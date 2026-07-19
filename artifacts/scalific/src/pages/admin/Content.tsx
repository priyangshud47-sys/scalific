"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContentBlock } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, AlertCircle, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type DefaultContentBlock = {
  section_key: string;
  content: string;
  media_url?: string | null;
};

const DEFAULT_CONTENT_BLOCKS: DefaultContentBlock[] = [
  { section_key: "nav_services_label", content: "Services" },
  { section_key: "nav_team_label", content: "Team" },
  { section_key: "nav_about_label", content: "About" },
  { section_key: "nav_contact_label", content: "Contact" },
  { section_key: "nav_cta_label", content: "Get Started" },
  { section_key: "hero_badge", content: "PREMIUM DIGITAL AGENCY" },
  { section_key: "hero_title", content: "Data-Driven Strategy.\\nRelentless Execution." },
  { section_key: "hero_subtitle", content: "We turn ambitious brands into market leaders. No fluff, just results." },
  { section_key: "hero_primary_cta", content: "Partner With Us" },
  { section_key: "hero_secondary_cta", content: "Explore Expertise" },
  { section_key: "proof_stats", content: "120+|Brands launched\n2.4x|Avg. Growth Rate\n98%|Client retention" },
  { section_key: "partner_names", content: "RealPluck\nVortexDev\nNexus & Home\nFiction Foods\nLoop Studio" },
  { section_key: "services_heading", content: "Core Expertise" },
  { section_key: "services_subtext", content: "Precision engineering for your digital presence. Every service is a focused strike on your growth targets." },
  { section_key: "services_intro_eyebrow", content: "What we do" },
  { section_key: "services_intro_heading", content: "Four disciplines. One runway to growth." },
  { section_key: "services_intro_text", content: "Every engagement draws from the same four capabilities, mixed to whatever stage your engine needs next." },
  { section_key: "process_eyebrow", content: "How we work" },
  { section_key: "process_heading", content: "Built from scratch, in order." },
  { section_key: "process_subtext", content: "Brand building only works as a sequence. We build every engagement through the same four stages." },
  { section_key: "process_step_1_title", content: "Discover & strategize" },
  { section_key: "process_step_1_text", content: "We map your market, audience, and goals to set the right growth direction." },
  { section_key: "process_step_2_title", content: "Design the identity" },
  { section_key: "process_step_2_text", content: "Name, look, voice, and core story come together into a system you can scale." },
  { section_key: "process_step_3_title", content: "Build the platform" },
  { section_key: "process_step_3_text", content: "Your website and marketing assets go live on a fast, conversion-focused foundation." },
  { section_key: "process_step_4_title", content: "Launch & grow" },
  { section_key: "process_step_4_text", content: "Campaigns go live, results are measured, and the best channels get sharper every week." },
  { section_key: "results_eyebrow", content: "Results" },
  { section_key: "results_heading", content: "The numbers behind the launch." },
  { section_key: "result_stats", content: "4.6x|Average increase in organic traffic within 6 months of a revised relaunch.\n63%|Average reduction in cost per lead after a full-funnel messaging overhaul.\n2.1x|Average conversion rate lift after a website rebuild and strategy reset." },
  { section_key: "team_heading", content: "The A-Team" },
  { section_key: "team_subtext", content: "Founders, operators, and specialists. The minds behind the execution." },
  { section_key: "founder_eyebrow", content: "Meet the founder" },
  { section_key: "founder_heading", content: "Built by someone who's flown this route before." },
  { section_key: "founder_text", content: "Scalific started from a simple frustration: agencies that hand off strategy, design, web, and marketing to four different teams who never talk to each other.\n\nEvery plan we write, site we build, and campaign we run stays connected from the first workshop to the first major growth curve." },
  { section_key: "founder_image_url", content: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop", media_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop" },
  { section_key: "about_heading", content: "Built for founders who demand performance." },
  { section_key: "about_text", content: "At Scalific, we combine creative excellence with rigorous data analysis. We are the Formula 1 team for your digital growth, built for founders who demand performance." },
  { section_key: "about_image_url", content: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop", media_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop" },
  { section_key: "about_stat1_value", content: "2.4x" },
  { section_key: "about_stat1_label", content: "Avg. Growth Rate" },
  { section_key: "about_stat2_value", content: "Top 1%" },
  { section_key: "about_stat2_label", content: "Creative Talent" },
  { section_key: "testimonials_eyebrow", content: "What clients say" },
  { section_key: "testimonials_heading", content: "Results, in their words." },
  { section_key: "cta_heading", content: "Ready to give your brand somewhere to go?" },
  { section_key: "cta_text", content: "Tell us where you're starting from. We'll point out the next practical moves." },
  { section_key: "cta_primary_button", content: "Book a free strategy call" },
  { section_key: "cta_secondary_button", content: "Look at services" },
  { section_key: "contact_heading", content: "Ready to scale?" },
  { section_key: "contact_subtext", content: "Let's discuss how we can engineer your next phase of growth. Fill out the form, and a partner will be in touch within 24 hours." },
  { section_key: "contact_bullets", content: "Bespoke strategic planning\nDirect access to founders\nData-backed execution" },
  { section_key: "contact_email", content: "hello@scalific.in" },
  { section_key: "contact_phone", content: "+91 98765 43210" },
  { section_key: "contact_location", content: "Remote-first, serving clients worldwide." },
  { section_key: "contact_form_missing_message", content: "Form configuration is missing." },
  { section_key: "contact_form_sending_label", content: "Sending..." },
  { section_key: "contact_form_submit_label", content: "Submit Inquiry" },
  { section_key: "contact_form_success_title", content: "Message Received" },
  { section_key: "contact_form_success_message", content: "Our team will review your inquiry and reach out within 24 hours." },
  { section_key: "contact_form_success_button", content: "Send Another Message" },
  { section_key: "footer_description", content: "A digital marketing agency building brands, websites, and campaigns from the ground up." },
  { section_key: "footer_services_heading", content: "Services" },
  { section_key: "footer_company_heading", content: "Company" },
  { section_key: "footer_company_links", content: "Our process\nResults\nAbout\nContact" },
  { section_key: "footer_cta_heading", content: "Get Started" },
  { section_key: "footer_cta_text", content: "Book a strategy call and get a clear next-step plan." },
  { section_key: "footer_cta_button", content: "Start the form" },
  { section_key: "footer_copyright", content: "Scalific Agency. All rights reserved." },
  { section_key: "footer_legal_links", content: "Privacy Policy\nTerms of Service" },
];

export default function AdminContent() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, { content: string; media_url: string }>>({});
  const [seeding, setSeeding] = useState(false);

  const fetchBlocks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("content_blocks").select("*").order("section_key");
    if (error) {
      toast.error("Failed to load content blocks");
    } else {
      setBlocks(data || []);
      
      const initEdits: Record<string, { content: string; media_url: string }> = {};
      data?.forEach(block => {
        initEdits[block.id] = { 
          content: block.content || "", 
          media_url: block.media_url || "" 
        };
      });
      setEdits(initEdits);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleEdit = (id: string, field: 'content' | 'media_url', value: string) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const saveBlock = async (id: string) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    const blockData = edits[id];
    
    const { error } = await supabase
      .from("content_blocks")
      .update({ 
        content: blockData.content, 
        media_url: blockData.media_url 
      })
      .eq("id", id);
      
    setSaving(prev => ({ ...prev, [id]: false }));
    
    if (error) {
      toast.error("Failed to save block");
    } else {
      toast.success("Block saved successfully");
    }
  };

  const saveAll = async () => {
    const ids = Object.keys(edits);
    let successCount = 0;
    
    for (const id of ids) {
      setSaving(prev => ({ ...prev, [id]: true }));
      const blockData = edits[id];
      const { error } = await supabase
        .from("content_blocks")
        .update({ content: blockData.content, media_url: blockData.media_url })
        .eq("id", id);
        
      setSaving(prev => ({ ...prev, [id]: false }));
      if (!error) successCount++;
    }
    
    if (successCount === ids.length) {
      toast.success("All blocks saved successfully");
    } else {
      toast.error(`Saved ${successCount} of ${ids.length} blocks. Some failed.`);
    }
  };

  const seedMissingBlocks = async () => {
    setSeeding(true);
    const existingKeys = new Set(blocks.map((block) => block.section_key));
    const missingBlocks = DEFAULT_CONTENT_BLOCKS.filter((block) => !existingKeys.has(block.section_key));

    if (missingBlocks.length === 0) {
      toast.success("All default content blocks already exist");
      setSeeding(false);
      return;
    }

    const { error } = await supabase.from("content_blocks").insert(
      missingBlocks.map((block) => ({
        section_key: block.section_key,
        content: block.content,
        media_url: block.media_url || null,
      }))
    );

    setSeeding(false);

    if (error) {
      toast.error(`Failed to add missing blocks: ${error.message}`);
    } else {
      toast.success(`Added ${missingBlocks.length} missing content blocks`);
      fetchBlocks();
    }
  };

  const formatKeyName = (key: string) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Content Blocks</h1>
          <p className="text-muted-foreground mt-1">Edit the text and media assets across the site sections.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={seedMissingBlocks} className="gap-2" disabled={loading || seeding}>
            <Plus className="w-4 h-4" />
            {seeding ? "Adding..." : "Add Missing Blocks"}
          </Button>
          <Button onClick={saveAll} className="gap-2" disabled={loading || blocks.length === 0}>
            <Save className="w-4 h-4" />
            Save All Changes
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
              <div className="flex justify-end"><Skeleton className="h-10 w-24" /></div>
            </div>
          ))}
        </div>
      ) : blocks.length === 0 ? (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No content blocks found</AlertTitle>
          <AlertDescription>
            The database doesn't have any content blocks defined. Please run the database migration SQL to seed the initial content blocks.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {blocks.map((block) => (
            <div key={block.id} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg">{formatKeyName(block.section_key)}</h3>
                  <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    {block.section_key}
                  </code>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Content</label>
                    <Textarea 
                      value={edits[block.id]?.content || ""} 
                      onChange={(e) => handleEdit(block.id, 'content', e.target.value)}
                      className="min-h-[100px] resize-y bg-background/50 font-sans"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Media URL (Optional)</label>
                    <Input 
                      value={edits[block.id]?.media_url || ""} 
                      onChange={(e) => handleEdit(block.id, 'media_url', e.target.value)}
                      placeholder="https://..."
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => saveBlock(block.id)}
                    disabled={saving[block.id]}
                    className="w-32"
                  >
                    {saving[block.id] ? "Saving..." : "Save Block"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

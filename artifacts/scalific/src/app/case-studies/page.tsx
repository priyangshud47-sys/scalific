import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Case Studies — Scalific Digital Agency",
  description: "See how we've helped startups achieve 4.6x organic traffic growth, 63% CPL reduction, and 2.1x conversion rate increases.",
};

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      title: "4.6x Organic Traffic Growth",
      client: "B2B SaaS Platform",
      description: "How we restructured their content architecture and implemented a programmatic SEO strategy to dominate their niche.",
      tags: ["SEO", "Content Strategy"],
    },
    {
      title: "63% CPL Reduction",
      client: "Fintech Startup",
      description: "A complete rebuild of their landing page ecosystem coupled with highly targeted performance marketing campaigns.",
      tags: ["Web Dev", "Paid Ads"],
    },
    {
      title: "2.1x Conversion Rate Increase",
      client: "D2C E-commerce Brand",
      description: "A total brand refresh and UI/UX overhaul focusing on mobile-first checkout experiences.",
      tags: ["Branding", "UI/UX"],
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-white pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">Case Studies</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-16">
          The numbers behind the launch. See how our integrated strategy, design, and marketing approach drives real business outcomes.
        </p>

        <div className="grid gap-8">
          {caseStudies.map((study, idx) => (
            <div key={idx} className="group relative bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 hover:bg-white/10 transition-colors cursor-pointer overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-primary text-sm font-bold tracking-wider uppercase">{study.client}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                    <div className="flex gap-2">
                      {study.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-white/10 rounded-md text-white/70">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{study.title}</h3>
                  <p className="text-muted-foreground text-lg">{study.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center border-t border-white/10 pt-16">
          <h2 className="text-3xl font-bold mb-6">Ready to be our next success story?</h2>
          <Link href="/contact" className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Get in touch
          </Link>
        </div>
      </div>
    </main>
  );
}

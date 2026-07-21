import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Scalific Founder-Led Agency",
  description: "Scalific is a founder-led digital agency. We combine strategy, design, and marketing under one roof to build scalable brands.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-white pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">Built by founders, for founders.</h1>
        
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-xl text-muted-foreground mb-8">
            Scalific started from a simple frustration: agencies that hand off strategy, design, web, and marketing to four different teams who never talk to each other.
          </p>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 my-12">
            <h3 className="text-2xl font-bold mb-4">The Integrated Approach</h3>
            <p className="text-muted-foreground">
              Every plan we write, site we build, and campaign we run stays connected from the first workshop to the first major growth curve. We act as your fractional growth team, ensuring that your brand narrative remains consistent across every single touchpoint.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">Meet the Team</h2>
          <div className="flex items-center gap-6 mb-12">
            <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden border border-white/20">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop" alt="Founder" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Priyangshu Das</h3>
              <p className="text-primary font-medium">Founder & Strategy Lead</p>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/10">
          <Link href="/contact" className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Work With Us
          </Link>
        </div>
      </div>
    </main>
  );
}

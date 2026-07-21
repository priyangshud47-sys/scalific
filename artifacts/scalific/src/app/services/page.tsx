import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Rocket, Target, BarChart3, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Services — Scalific Digital Agency",
  description: "Explore our core disciplines: Strategy, Brand Identity, Web Development, and Growth Marketing.",
};

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-white pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">Our Services</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-16">
          We don't just build websites; we build scalable digital growth engines. Our four core disciplines work in harmony to take your brand from concept to market leader.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Strategy */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
            <Search className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Discover & Strategize</h3>
            <p className="text-muted-foreground">
              Deep research into your market, competitors, and audience to build a bulletproof positioning strategy before a single pixel is drawn.
            </p>
          </div>

          {/* Brand */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
            <Target className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Design the Identity</h3>
            <p className="text-muted-foreground">
              Crafting premium visual identities, typography, and design systems that communicate trust and stand out in crowded markets.
            </p>
          </div>

          {/* Platform */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
            <Rocket className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Build the Platform</h3>
            <p className="text-muted-foreground">
              Developing lightning-fast, conversion-optimized websites and web applications tailored for lead generation and user experience.
            </p>
          </div>

          {/* Growth */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
            <BarChart3 className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Launch & Grow</h3>
            <p className="text-muted-foreground">
              Data-driven performance marketing, SEO, and continuous conversion rate optimization to scale your customer acquisition.
            </p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <Link href="/contact" className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Discuss Your Project
          </Link>
        </div>
      </div>
    </main>
  );
}

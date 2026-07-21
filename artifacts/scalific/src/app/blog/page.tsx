import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & Resources — Scalific Digital Agency",
  description: "Insights, guides, and resources on brand strategy, web development, and growth marketing for founders.",
};

export default function BlogPage() {
  const posts = [
    {
      title: "How much does a website rebuild really cost in 2026?",
      category: "Guides",
      date: "July 12, 2026",
      excerpt: "Breaking down the true costs of a performance-focused website rebuild vs a template theme.",
    },
    {
      title: "Founder-led brand strategy: Why delegating vision fails",
      category: "Strategy",
      date: "June 28, 2026",
      excerpt: "Why the most successful rebrands happen when the founder stays deeply involved in the strategy phase.",
    },
    {
      title: "Website conversion rate optimization checklist",
      category: "Resources",
      date: "June 15, 2026",
      excerpt: "Our internal 45-point checklist for auditing and optimizing landing page conversion rates.",
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-white pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">Insights & Resources</h1>
        <p className="text-xl text-muted-foreground mb-16">
          Tactical advice and deep dives into branding, design, and growth marketing.
        </p>

        <div className="space-y-12">
          {posts.map((post, idx) => (
            <article key={idx} className="group border-b border-white/10 pb-12 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-primary text-sm font-bold tracking-wider uppercase">{post.category}</span>
                <span className="text-muted-foreground text-sm">{post.date}</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">{post.title}</h2>
              <p className="text-muted-foreground text-lg mb-6">{post.excerpt}</p>
              <span className="text-white font-medium inline-flex items-center group-hover:text-primary transition-colors">
                Read Article <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

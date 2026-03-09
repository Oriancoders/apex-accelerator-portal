import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Newspaper, X, Calendar } from "lucide-react";

export default function NewsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: news = [], isLoading } = useQuery({
    queryKey: ["public-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_items")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const categories = ["All", ...Array.from(new Set(news.map((n) => n.category)))];

  const filtered = news.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || n.category === category;
    return matchSearch && matchCat;
  });

  return (
    <ProtectedLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-10 sm:px-10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Newspaper className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Salesforce News</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
              Latest Salesforce News
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mb-6">
              Stay up to date with the latest releases, announcements, and innovations from the Salesforce ecosystem.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search news, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-background/70 backdrop-blur border-border"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                category === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              {cat}
              {cat !== "All" && (
                <span className="opacity-70">({news.filter((n) => n.category === cat).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* News list */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading news...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Newspaper className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No news found</h3>
            <p className="text-sm text-muted-foreground">Try a different search or category.</p>
            <button
              className="mt-4 text-sm text-primary hover:underline"
              onClick={() => { setSearch(""); setCategory("All"); }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((n) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card hover:shadow-md hover:border-primary/25 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {n.category}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1.5">
                    {n.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.summary}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto pt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

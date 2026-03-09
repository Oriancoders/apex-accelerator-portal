import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Zap, Search, Tag, Clock, User, ChevronRight,
  Settings, X, Lightbulb,
} from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Article = Tables<"articles">;

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  "recipe":    { label: "Recipe",    icon: <Settings className="h-4 w-4" />, color: "text-accent",   bg: "bg-accent/10" },
  "quick_win": { label: "Quick Win", icon: <Zap className="h-4 w-4" />,      color: "text-warning",  bg: "bg-warning/10" },
};

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat, icon: <Zap className="h-4 w-4" />, color: "text-accent", bg: "bg-accent/10" };
}

function ArticleBody({ content }: { content: string }) {
  // Detect HTML content (TipTap produces HTML)
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  if (isHtml) {
    return (
      <div
        className="prose prose-sm max-w-none text-foreground
          prose-headings:text-foreground prose-p:text-muted-foreground
          prose-strong:text-foreground prose-li:text-muted-foreground
          prose-a:text-primary prose-code:text-accent
          prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  const lines = content.split("\n");
  return (
    <div className="prose prose-sm max-w-none text-foreground space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith("# "))  return <h1 key={i} className="text-2xl font-bold mt-6 mb-2">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold mt-5 mb-2">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith("- ")) return <li key={i} className="ml-4 text-muted-foreground list-disc">{line.slice(2)}</li>;
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Article | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["recipes-page"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .in("category", ["recipe", "quick_win"])
        .order("created_at", { ascending: false });
      return (data || []) as Article[];
    },
  });

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  const filtered = articles.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      (a.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = categoryFilter === "all" || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const featuredArticles = articles.slice(0, 3);

  return (
    <ProtectedLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent/10 via-accent/5 to-background border border-accent/15 px-6 py-10 sm:px-10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-warning/10 blur-2xl" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shadow-sm">
                <Lightbulb className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Recipes & Quick Wins</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
              Salesforce Recipes & Quick Wins
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mb-6">
              Step-by-step recipes, flow templates, formulas, and quick wins to speed up your Salesforce implementations.
            </p>
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes, tags..."
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

        {/* ── Featured (only when not searching/filtering) ─────────── */}
        {!search && categoryFilter === "all" && featuredArticles.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Featured</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {featuredArticles.map((a) => {
                const cm = categoryMeta(a.category);
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="text-left p-4 rounded-2xl border border-border bg-card hover:shadow-md hover:border-accent/30 transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cm.bg} ${cm.color}`}>
                      {cm.icon}
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">{a.title}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cm.bg} ${cm.color}`}>{cm.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Category filter pills ────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              categoryFilter === "all"
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-card text-muted-foreground border-border hover:border-accent/30 hover:bg-accent/5"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            All
            <span className="ml-0.5 opacity-70">({articles.length})</span>
          </button>
          {categories.map((cat) => {
            const cm = categoryMeta(cat);
            const count = articles.filter((a) => a.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  categoryFilter === cat
                    ? `${cm.bg} ${cm.color} border-current`
                    : "bg-card text-muted-foreground border-border hover:border-accent/30 hover:bg-accent/5"
                }`}
              >
                {cm.icon}
                {cm.label}
                <span className="ml-0.5 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* ── Article grid ─────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Lightbulb className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No recipes found</h3>
            <p className="text-sm text-muted-foreground">Try a different search or filter.</p>
            <Button variant="ghost" className="mt-4 rounded-xl" onClick={() => { setSearch(""); setCategoryFilter("all"); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div>
            {search && (
              <p className="text-xs text-muted-foreground mb-3">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "<span className="font-medium text-foreground">{search}</span>"
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((a) => {
                const cm = categoryMeta(a.category);
                const preview = a.content.replace(/<[^>]*>/g, "").replace(/#+\s/g, "").slice(0, 120).trim();
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="text-left p-5 rounded-2xl border border-border bg-card hover:shadow-md hover:border-accent/25 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cm.bg} ${cm.color}`}>
                        {cm.icon}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1.5">
                      {a.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                      {preview}…
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cm.bg} ${cm.color}`}>
                        {cm.label}
                      </span>
                      {(a.tags ?? []).slice(0, 2).map((t) => (
                        <span key={t} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Tag className="h-2.5 w-2.5" />{t}
                        </span>
                      ))}
                      <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(a.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Article detail dialog ────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl mx-4 sm:mx-auto">
          {selected && (() => {
            const cm = categoryMeta(selected.category);
            return (
              <>
                <DialogHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cm.bg} ${cm.color}`}>
                      {cm.icon}
                      {cm.label}
                    </span>
                    {(selected.tags ?? []).slice(0, 3).map((t) => (
                      <span key={t} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <Tag className="h-2.5 w-2.5" />{t}
                      </span>
                    ))}
                  </div>
                  <DialogTitle className="text-lg sm:text-xl leading-snug text-foreground">
                    {selected.title}
                  </DialogTitle>
                  <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                    {selected.author && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {selected.author}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(selected.created_at), "MMMM d, yyyy")}
                    </span>
                  </div>
                </DialogHeader>
                <div className="border-t border-border pt-4 mt-1">
                  <ArticleBody content={selected.content} />
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  );
}

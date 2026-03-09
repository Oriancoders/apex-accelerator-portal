import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function KnowledgeBaseWidget() {
  const navigate = useNavigate();

  const { data: articles = [] } = useQuery({
    queryKey: ["knowledge-widget"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, category, tags")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  return (
    <div className="widget-card h-full">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Knowledge Base</h3>
        </div>
        <button onClick={() => navigate("/knowledge")} className="text-primary text-xs font-medium hover:underline">Browse All</button>
      </div>
      <div className="widget-card-body space-y-1">
        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No articles yet</p>
        ) : (
          articles.map((a) => (
            <div
              key={a.id}
              onClick={() => navigate("/knowledge")}
              className="p-3 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer min-h-[52px]"
            >
              <p className="text-sm font-medium text-foreground leading-tight">{a.title}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="status-badge bg-primary/10 text-primary">{a.category.replace("-", " ")}</span>
                {(a.tags ?? []).slice(0, 2).map((t) => (
                  <span key={t} className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Tag className="h-2.5 w-2.5" />{t}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { Newspaper, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function NewsWidget() {
  const navigate = useNavigate();

  const { data: news = [] } = useQuery({
    queryKey: ["news-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_items")
        .select("id, title, url, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="widget-card h-full">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Salesforce News</h3>
        </div>
        <button onClick={() => navigate("/news")} className="text-primary text-xs font-medium hover:underline">View All</button>
      </div>
      <div className="widget-card-body space-y-1">
        {news.map((n) => (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between p-3 rounded-xl hover:bg-muted/70 transition-colors group min-h-[52px]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-3" />
          </a>
        ))}
      </div>
    </div>
  );
}

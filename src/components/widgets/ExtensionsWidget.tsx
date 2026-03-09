import { Chrome, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ExtensionsWidget() {
  const navigate = useNavigate();

  const { data: extensions = [] } = useQuery({
    queryKey: ["extensions-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extensions")
        .select("id, name, description, url")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="widget-card h-full">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <Chrome className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Chrome Extensions</h3>
        </div>
        <button onClick={() => navigate("/extensions")} className="text-primary text-xs font-medium hover:underline">View All</button>
      </div>
      <div className="widget-card-body space-y-1">
        {extensions.map((e) => (
          <a
            key={e.id}
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between p-3 rounded-xl hover:bg-muted/70 transition-colors group min-h-[52px]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{e.name}</p>
              <p className="text-xs text-muted-foreground">{e.description}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-3" />
          </a>
        ))}
      </div>
    </div>
  );
}

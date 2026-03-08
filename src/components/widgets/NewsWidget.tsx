import { Newspaper, ExternalLink } from "lucide-react";

const news = [
  { title: "Spring '26 Release Highlights", date: "Mar 6, 2026", url: "#" },
  { title: "Einstein AI Copilot Now GA", date: "Mar 4, 2026", url: "#" },
  { title: "Flow Builder: New Screen Components", date: "Mar 2, 2026", url: "#" },
  { title: "Salesforce Acquires Data Cloud Startup", date: "Feb 28, 2026", url: "#" },
  { title: "Apex Test Performance Improvements", date: "Feb 25, 2026", url: "#" },
];

export default function NewsWidget() {
  return (
    <div className="widget-card h-full">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Salesforce News</h3>
        </div>
      </div>
      <div className="widget-card-body space-y-1">
        {news.map((n) => (
          <a
            key={n.title}
            href={n.url}
            className="flex items-start justify-between p-3 rounded-xl hover:bg-muted/70 transition-colors group min-h-[52px]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.date}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-3" />
          </a>
        ))}
      </div>
    </div>
  );
}

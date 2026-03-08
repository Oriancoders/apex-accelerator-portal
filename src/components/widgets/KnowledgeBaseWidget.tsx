import { BookOpen, Tag } from "lucide-react";

const articles = [
  { title: "Salesforce Security Best Practices 2026", tags: ["Security", "Admin"], category: "Guide" },
  { title: "Optimizing SOQL Queries for Large Data Sets", tags: ["Dev", "Performance"], category: "Best Practice" },
  { title: "Building Dynamic Forms with Flow", tags: ["Flow", "No-Code"], category: "Guide" },
  { title: "Data Migration Checklist", tags: ["Admin", "Data"], category: "Checklist" },
];

export default function KnowledgeBaseWidget() {
  return (
    <div className="widget-card h-full">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Knowledge Base</h3>
        </div>
        <a href="/knowledge" className="text-primary text-xs font-medium hover:underline">Browse All</a>
      </div>
      <div className="widget-card-body space-y-1">
        {articles.map((a) => (
          <div
            key={a.title}
            className="p-3 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer min-h-[52px]"
          >
            <p className="text-sm font-medium text-foreground leading-tight">{a.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="status-badge bg-primary/10 text-primary">{a.category}</span>
              {a.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" />{t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

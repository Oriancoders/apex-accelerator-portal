import { Lightbulb, Zap } from "lucide-react";

const recipes = [
  { title: "Auto-populate fields with Flow", type: "Flow Recipe", cloud: "Sales Cloud" },
  { title: "Round-robin lead assignment", type: "Quick Win", cloud: "Sales Cloud" },
  { title: "VLOOKUP formula for cross-object", type: "Formula", cloud: "Service Cloud" },
  { title: "Escalation rules with milestones", type: "Quick Win", cloud: "Service Cloud" },
  { title: "Dynamic approval process template", type: "Flow Recipe", cloud: "Platform" },
];

export default function RecipesWidget() {
  return (
    <div className="widget-card">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm text-foreground">Recipes & Quick Wins</h3>
        </div>
      </div>
      <div className="widget-card-body space-y-2">
        {recipes.map((r) => (
          <div key={r.title} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
            <Zap className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">{r.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="status-badge bg-accent/10 text-accent">{r.type}</span>
                <span className="text-xs text-muted-foreground">{r.cloud}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

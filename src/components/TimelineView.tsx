import { Clock } from "lucide-react";

interface RoadmapItem {
  hour: number;
  title: string;
  description: string;
}

export default function TimelineView({ roadmap }: { roadmap: RoadmapItem[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-4">
        {roadmap.map((item, i) => (
          <div key={i} className="relative pl-10">
            <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
              <Clock className="h-2.5 w-2.5 text-primary" />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary">Hour {item.hour}</span>
                <span className="text-sm font-medium text-foreground">{item.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

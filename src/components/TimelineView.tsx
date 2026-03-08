import { Clock, CheckSquare } from "lucide-react";

interface SubTask {
  title: string;
}

interface RoadmapItem {
  hour: number;
  title: string;
  description: string;
  subtasks?: SubTask[];
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

              {item.subtasks && item.subtasks.length > 0 && (
                <div className="mt-2 pl-3 border-l-2 border-primary/20 space-y-1">
                  {item.subtasks.map((sub, si) => (
                    <div key={si} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckSquare className="h-3 w-3 text-primary/60 flex-shrink-0" />
                      <span>{sub.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

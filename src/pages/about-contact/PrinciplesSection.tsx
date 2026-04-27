import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Principle } from "./types";

interface PrinciplesSectionProps {
  principles: Principle[];
}

export function PrinciplesSection({ principles }: PrinciplesSectionProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid gap-4 sm:grid-cols-3">
        {principles.map((item) => (
          <Card key={item.title} className="rounded-ds-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <item.icon className="h-4 w-4 text-primary" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

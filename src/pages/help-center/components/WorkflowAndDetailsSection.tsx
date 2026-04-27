import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { WORKFLOW_STEPS } from "../constants";

export function WorkflowAndDetailsSection() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            How Work Moves
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.title} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5 text-primary" />
            Good Ticket Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Add the goal, current problem, expected result, deadline, and screenshots or files when useful.</p>
          <p>Choose priority based on business urgency. Higher priority can affect estimated credit cost for non-subscription work.</p>
          <p>Use ticket chat for updates, clarification, and feedback while work is in progress.</p>
        </CardContent>
      </Card>
    </section>
  );
}

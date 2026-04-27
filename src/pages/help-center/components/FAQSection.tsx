import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { FAQ_ITEMS } from "../constants";

export function FAQSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="h-5 w-5 text-primary" />
          Common Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question} className="rounded-ds-md border border-border-subtle p-4">
            <p className="text-sm font-semibold text-foreground">{item.question}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

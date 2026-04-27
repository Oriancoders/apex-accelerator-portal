import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Ticket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="rounded-ds-xl border border-border-subtle bg-surface-elevated p-5 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <Badge variant="outline" className="mb-3 gap-1.5">
            <LifeBuoy className="h-3.5 w-3.5" />
            Client Guide
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Learn how to use the portal
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A quick guide to tickets, credits, subscriptions, company access, and the delivery flow.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="gap-2">
            <Link to="/tickets/new">
              <Ticket className="h-4 w-4" />
              Submit Ticket
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/pricing">
              Pricing Guide
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

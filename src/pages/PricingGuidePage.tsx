import ProtectedLayout from "@/components/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import { Coins, Clock, Calculator, ArrowRight, HelpCircle, Sparkles, Gift } from "lucide-react";
import { Link } from "react-router-dom";

export default function PricingGuidePage() {
  const { settings, isLoading } = useCreditSettings();

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </ProtectedLayout>
    );
  }

  const priorityEntries = Object.entries(settings.priorityRates).sort((a, b) => a[1] - b[1]);
  const difficultyEntries = Object.entries(settings.difficultyRates).sort((a, b) => a[1] - b[1]);

  // Example calculation
  const exPriority = "medium";
  const exDifficulty = "hard";
  const exHours = 3;
  const exPriorityRate = settings.priorityRates[exPriority] ?? 15;
  const exDifficultyRate = settings.difficultyRates[exDifficulty] ?? 20;
  const exPerHour = exPriorityRate + exDifficultyRate;
  const exTotal = exPerHour * exHours;

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">How Pricing Works</h1>
          <p className="text-muted-foreground mt-1">
            Understand how credit costs are calculated for your service requests
          </p>
        </div>

        {/* Step 1: What are credits */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-5 w-5 text-accent" />
              What Are Credits?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Credits are the currency used to pay for Salesforce service requests. Each credit is worth{" "}
              <span className="font-semibold text-foreground">${settings.dollarPerCredit.toFixed(2)} USD</span>.
            </p>
            <p>
              When you submit a ticket, our experts review it and propose a solution with a credit cost based on the complexity and urgency of the work.
            </p>
          </CardContent>
        </Card>

        {/* Step 2: The Formula */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              How Costs Are Calculated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-2">The Formula</p>
              <p className="text-lg font-bold text-foreground">
                (Priority Rate + Difficulty Rate) × Hours = Total Credits
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority Rates */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Priority Rates</h3>
                <p className="text-xs text-muted-foreground mb-3">Set by you when creating a ticket</p>
                <div className="space-y-2">
                  {priorityEntries.map(([level, rate]) => (
                    <div key={level} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <Badge variant="outline" className="capitalize text-xs">{level}</Badge>
                      <span className="text-sm font-semibold text-foreground">{rate} cr/hr</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Rates */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Difficulty Rates</h3>
                <p className="text-xs text-muted-foreground mb-3">Assessed by our experts after review</p>
                <div className="space-y-2">
                  {difficultyEntries.map(([level, rate]) => (
                    <div key={level} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <Badge variant="outline" className="capitalize text-xs">
                        {level === "easy" ? "🟢" : level === "medium" ? "🟡" : level === "hard" ? "🟠" : "🔴"} {level}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">{rate} cr/hr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Example */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-warning" />
              Example Calculation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <p className="text-muted-foreground">
                A ticket with <span className="font-semibold text-foreground capitalize">{exPriority}</span> priority,{" "}
                <span className="font-semibold text-foreground capitalize">{exDifficulty}</span> difficulty, estimated at{" "}
                <span className="font-semibold text-foreground">{exHours} hours</span>:
              </p>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority rate ({exPriority}):</span>
                  <span className="font-medium text-foreground">{exPriorityRate} cr/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty rate ({exDifficulty}):</span>
                  <span className="font-medium text-foreground">{exDifficultyRate} cr/hr</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Per hour rate:</span>
                  <span className="text-primary">{exPerHour} cr/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hours:</span>
                  <span className="font-medium text-foreground">× {exHours}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total cost:</span>
                  <span className="text-accent">{exTotal} credits</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Dollar equivalent:</span>
                  <span>${(exTotal * settings.dollarPerCredit).toFixed(2)} USD</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Credit Packages */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-5 w-5 text-success" />
              Buying Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              Purchase credit packages to fund your service requests. Larger packages include bonus credits at no extra charge!
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {settings.packages.map((pkg, i) => (
                <div key={i} className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-lg font-bold text-foreground">{pkg.buy}</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                  {pkg.bonus > 0 && (
                    <Badge variant="outline" className="mt-1 text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">
                      +{pkg.bonus} free
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <Button asChild className="w-full gap-2 mt-2">
              <Link to="/credits">
                <Sparkles className="h-4 w-4" />
                Buy Credits Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Step 5: Process */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              The Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { step: 1, title: "Submit a Ticket", desc: "Describe your Salesforce issue or request with as much detail as possible." },
                { step: 2, title: "Expert Review", desc: "Our experts review your ticket, assess difficulty, and create a solution roadmap." },
                { step: 3, title: "Review Proposal", desc: "You'll see the detailed action plan, estimated hours, and total credit cost." },
                { step: 4, title: "Approve & Pay", desc: "If you agree with the proposal, approve it and credits will be deducted from your balance." },
                { step: 5, title: "Work In Progress", desc: "Our team works on your request. You can chat with the expert and track progress." },
                { step: 6, title: "Completion", desc: "Once done, the ticket is marked complete and you'll be notified." },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}

import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, Sparkles, Gift, Loader2, ArrowUpRight, ArrowDownRight, History, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

export default function CreditsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { settings, isLoading } = useCreditSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [purchasingIndex, setPurchasingIndex] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const queryClient = useQueryClient();
  const historyRef = useRef<HTMLDivElement>(null);

  // Scroll to history section if hash is #history
  useEffect(() => {
    if (location.hash === "#history" && historyRef.current) {
      setTimeout(() => historyRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [location.hash, isLoading]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["credit-transactions", user?.id, page],
    queryFn: async () => {
      if (!user?.id) return { rows: [], total: 0 };
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("credit_transactions")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: data || [], total: count || 0 };
    },
    enabled: !!user?.id,
  });

  const transactions = txData?.rows ?? [];
  const totalCount = txData?.total ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Handle Stripe success redirect
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;

    setVerifying(true);
    supabase.functions
      .invoke("verify-credit-payment", { body: { sessionId } })
      .then(async ({ data, error }) => {
        if (error) {
          toast.error("Payment verification failed. Please contact support.");
          console.error(error);
        } else if (data?.already_processed) {
          toast.info("This payment was already processed.");
        } else if (data?.success) {
          toast.success(`${data.credits_added} credits added to your account!`);
          await refreshProfile();
          queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
        }
      })
      .finally(() => {
        setVerifying(false);
        setSearchParams({}, { replace: true });
      });
  }, []);

  const handlePurchase = async (index: number) => {
    setPurchasingIndex(index);
    try {
      // Send only the package index — server computes the price
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { packageIndex: index },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create checkout session");
      setPurchasingIndex(null);
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </ProtectedLayout>
    );
  }

  const bestValueIndex = settings.packages.length >= 2 ? settings.packages.length - 2 : 0;

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto">
        {verifying && (
          <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-muted rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-foreground font-medium">Verifying your payment...</span>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Buy Credits</h1>
          <p className="text-muted-foreground mt-1">Credits are used to pay for Salesforce service requests</p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-muted rounded-full">
            <Coins className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold text-foreground">{profile?.credits ?? 0}</span>
            <span className="text-sm text-muted-foreground">current balance</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {settings.packages.map((pkg, i) => {
            const price = pkg.buy * settings.dollarPerCredit;
            const totalCredits = pkg.buy + pkg.bonus;
            const isPopular = i === bestValueIndex;
            const isPurchasing = purchasingIndex === i;

            return (
              <Card
                key={i}
                className={`relative transition-shadow hover:shadow-lg ${
                  isPopular ? "border-primary shadow-primary" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      <Sparkles className="h-3 w-3" /> Best Value
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-6">
                  <CardTitle className="text-3xl font-bold text-foreground">{pkg.buy}</CardTitle>
                  <p className="text-sm text-muted-foreground">credits</p>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  {pkg.bonus > 0 && (
                    <Badge variant="outline" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] gap-1">
                      <Gift className="h-3 w-3" />
                      +{pkg.bonus} FREE
                    </Badge>
                  )}
                  <div>
                    <p className="text-2xl font-bold text-foreground">${price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${settings.dollarPerCredit.toFixed(2)}/credit • Get {totalCredits} total
                    </p>
                  </div>
                  <Button
                    className="w-full gap-2"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isPurchasing || purchasingIndex !== null}
                    onClick={() => handlePurchase(i)}
                  >
                    {isPurchasing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {isPurchasing ? "Redirecting..." : "Purchase"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Transaction History */}
        <Separator className="my-10" />
        <div ref={historyRef}>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Transaction History</h2>
          </div>

          {txLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No transactions yet. Purchase credits to get started!
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(tx.created_at), "MMM d, yyyy h:mm a")}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {tx.description || tx.type}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={`inline-flex items-center gap-1 ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                              {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                              {isPositive ? "+" : ""}{tx.amount}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

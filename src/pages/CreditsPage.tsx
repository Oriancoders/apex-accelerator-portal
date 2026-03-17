import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Coins, CreditCard, Sparkles, Gift, Loader2, ArrowUpRight, ArrowDownRight, History, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import type { Tables } from "@/integrations/supabase/types";

type WithdrawalRequest = Tables<"credit_withdrawal_requests">;

export default function CreditsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { settings, isLoading } = useCreditSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [purchasingIndex, setPurchasingIndex] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const queryClient = useQueryClient();
  const historyRef = useRef<HTMLDivElement>(null);
  const withdrawRef = useRef<HTMLDivElement>(null);
  const [withdrawCredits, setWithdrawCredits] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
  const [withdrawAccountDetails, setWithdrawAccountDetails] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");

  // Scroll to hash section anchors.
  useEffect(() => {
    if (location.hash === "#history" && historyRef.current) {
      setTimeout(() => historyRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
      return;
    }

    if (location.hash === "#withdraw" && withdrawRef.current) {
      setTimeout(() => withdrawRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
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

  const { data: withdrawalRequests = [], isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["my-withdrawal-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("credit_withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as WithdrawalRequest[];
    },
    enabled: !!user?.id,
  });

  const submitWithdrawalMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be logged in");

      const requested = Number(withdrawCredits);
      if (!Number.isFinite(requested) || requested <= 0) {
        throw new Error("Enter a valid credit amount");
      }

      if (requested < settings.minWithdrawalCredits) {
        throw new Error(`Minimum withdrawal is ${settings.minWithdrawalCredits} credits`);
      }

      const available = Number(profile?.credits ?? 0);
      if (requested > available) {
        throw new Error("Requested credits exceed your balance");
      }

      if (!withdrawAccountDetails.trim()) {
        throw new Error("Account details are required");
      }

      const { error } = await supabase.from("credit_withdrawal_requests").insert({
        user_id: user.id,
        requested_credits: requested,
        payment_method: withdrawMethod,
        account_details: withdrawAccountDetails.trim(),
        requester_note: withdrawNote.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Withdrawal request sent to admin");
      setWithdrawCredits("");
      setWithdrawMethod("bank_transfer");
      setWithdrawAccountDetails("");
      setWithdrawNote("");
      queryClient.invalidateQueries({ queryKey: ["my-withdrawal-requests", user?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

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

        <Separator className="my-10" />

        <div ref={withdrawRef} className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Credit Withdrawal</h2>
          <p className="text-sm text-muted-foreground">
            Request admin to manually send your payout. Credits are deducted only after admin marks the payout as paid.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submit Withdrawal Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Requested Credits</Label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={withdrawCredits}
                    onChange={(e) => setWithdrawCredits(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                    placeholder="e.g. 100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Payout Method</Label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="upi">UPI</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Account Details</Label>
                <Textarea
                  value={withdrawAccountDetails}
                  onChange={(e) => setWithdrawAccountDetails(e.target.value)}
                  placeholder="Enter account name, account number/UPI/PayPal ID, bank name, IFSC/SWIFT, etc."
                  rows={4}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Textarea
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder="Anything admin should know for this payout"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Available: {profile?.credits ?? 0} · Min withdrawal: {settings.minWithdrawalCredits}
                </span>
                <Button
                  onClick={() => submitWithdrawalMutation.mutate()}
                  disabled={submitWithdrawalMutation.isPending}
                  className="rounded-xl"
                >
                  {submitWithdrawalMutation.isPending ? "Sending..." : "Send Request"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <div className="text-sm text-muted-foreground">Loading requests...</div>
              ) : withdrawalRequests.length === 0 ? (
                <div className="text-sm text-muted-foreground">No withdrawal requests yet.</div>
              ) : (
                <div className="space-y-2">
                  {withdrawalRequests.slice(0, 8).map((req) => (
                    <div key={req.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{req.requested_credits} credits</p>
                        <Badge variant="outline" className="capitalize">{req.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {req.payment_method.replace("_", " ")} · {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                      {req.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-2">Admin note: {req.admin_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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

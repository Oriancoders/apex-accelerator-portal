import { useEffect, useRef, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Loader2, Sparkles, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useCreditTransactions, useWithdrawalRequests } from "./hooks/useCreditQueries";
import { useSubmitWithdrawalMutation, usePurchaseCreditsMutation } from "./hooks/useCreditMutations";
import { CreditPackages } from "./components/CreditPackages";
import { TransactionHistory } from "./components/TransactionHistory";
import { PAGE_SIZE } from "./constants";
import type { PaymentVerificationResponse } from "./types";

function isAllowedCheckoutUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

export default function CreditsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { settings, isLoading: settingsLoading } = useCreditSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [purchasingIndex, setPurchasingIndex] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const withdrawRef = useRef<HTMLDivElement>(null);
  const [withdrawCredits, setWithdrawCredits] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
  const [withdrawAccountDetails, setWithdrawAccountDetails] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [page, setPage] = useState(0);
  const sessionId = searchParams.get("session_id");

  const { data: txData, isLoading: txLoading } = useCreditTransactions(user?.id, page);
  const { data: withdrawalRequests = [], isLoading: withdrawalsLoading } = useWithdrawalRequests(user?.id);

  const submitWithdrawalMutation = useSubmitWithdrawalMutation(user?.id, settings.minWithdrawalCredits, profile?.credits ?? 0);
  const purchaseCreditsMutation = usePurchaseCreditsMutation();

  const transactions = txData?.rows ?? [];
  const totalCount = txData?.total ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => {
    if (location.hash === "#history" && historyRef.current) {
      setTimeout(() => historyRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
      return;
    }

    if (location.hash === "#withdraw" && withdrawRef.current) {
      setTimeout(() => withdrawRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [location.hash, settingsLoading]);

  useEffect(() => {
    if (!sessionId) return;

    setVerifying(true);
    supabase.functions
      .invoke("verify-credit-payment", { body: { sessionId } })
      .then(async ({ data, error }) => {
        const response = data as PaymentVerificationResponse;
        if (error) {
          toast.error("Payment verification failed. Please contact support.");
          console.error(error);
        } else if (response?.already_processed) {
          toast.info("This payment was already processed.");
        } else if (response?.success) {
          toast.success(`${response.credits_added} credits added to your account!`);
          await refreshProfile();
        }
      })
      .finally(() => {
        setVerifying(false);
        setSearchParams({}, { replace: true });
      });
  }, [sessionId, setSearchParams, refreshProfile]);

  const handlePurchase = async (index: number) => {
    setPurchasingIndex(index);
    try {
      const { url } = await purchaseCreditsMutation.mutateAsync(index);
      if (url && isAllowedCheckoutUrl(url)) {
        window.location.href = url;
      } else {
        throw new Error("Invalid checkout URL returned");
      }
    } catch {
      setPurchasingIndex(null);
    }
  };

  if (settingsLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </ProtectedLayout>
    );
  }

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
          <p className="text-muted-foreground mt-1">Credits are used to pay for service requests</p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-muted rounded-full">
            <Coins className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold text-foreground">{profile?.credits ?? 0}</span>
            <span className="text-sm text-muted-foreground">current balance</span>
          </div>
        </div>

        <CreditPackages
          packages={settings.packages}
          dollarPerCredit={settings.dollarPerCredit}
          onPurchase={handlePurchase}
          purchasingIndex={purchasingIndex}
        />

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
                    className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
                    placeholder="e.g. 100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Payout Method</Label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
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
                  onClick={() =>
                    submitWithdrawalMutation.mutate({
                      credits: withdrawCredits,
                      method: withdrawMethod,
                      accountDetails: withdrawAccountDetails,
                      note: withdrawNote,
                    })
                  }
                  disabled={submitWithdrawalMutation.isPending}
                  className="rounded-ds-md"
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
                    <div key={req.id} className="rounded-ds-md border border-border-subtle p-3">
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

        <Separator className="my-10" />
        <div ref={historyRef}>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Transaction History</h2>
          </div>

          <TransactionHistory
            transactions={transactions}
            totalCount={totalCount}
            currentPage={page}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            isLoading={txLoading}
            onPageChange={setPage}
          />
        </div>
      </div>
    </ProtectedLayout>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type WithdrawalsMinCardProps = {
  effectiveMinWithdraw: number;
  minWithdrawInput: string;
  isPending: boolean;
  onInputChange: (value: string) => void;
  onSave: () => void;
};

export default function WithdrawalsMinCard({
  effectiveMinWithdraw,
  minWithdrawInput,
  isPending,
  onInputChange,
  onSave,
}: WithdrawalsMinCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Minimum Withdrawal Credits</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Current minimum: {effectiveMinWithdraw} credits</p>
          <Input
            type="number"
            min="1"
            step="0.01"
            value={minWithdrawInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={String(effectiveMinWithdraw || 10)}
            className="h-11 rounded-xl"
          />
        </div>
        <Button className="h-11 rounded-xl" onClick={onSave} disabled={isPending || !minWithdrawInput.trim()}>
          Save Minimum
        </Button>
      </CardContent>
    </Card>
  );
}

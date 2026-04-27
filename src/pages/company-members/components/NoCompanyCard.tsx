import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NoCompanyCard() {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader>
        <CardTitle>No active company selected</CardTitle>
        <CardDescription>Switch or create a company first to manage members.</CardDescription>
      </CardHeader>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Save, Loader2 } from "lucide-react";

interface PersonalInfoFormProps {
  form: { full_name: string; email: string; phone: string };
  onFormChange: (form: any) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function PersonalInfoForm({ form, onFormChange, onSubmit, isPending }: PersonalInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="space-y-4"
        >
          <div>
            <Label className="text-xs">Full Name</Label>
            <Input
              value={form.full_name}
              onChange={(e) => onFormChange({ ...form, full_name: e.target.value })}
              className="mt-1"
              maxLength={120}
              autoComplete="name"
            />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={form.email} disabled className="mt-1 bg-muted" />
            <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="mt-1"
              maxLength={30}
              autoComplete="tel"
            />
          </div>
          <Button type="submit" className="w-full rounded-ds-md" disabled={isPending}>
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

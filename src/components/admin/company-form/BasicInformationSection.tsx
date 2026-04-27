import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyFormData } from "./types";
import { toSlug } from "./utils";

interface BasicInformationSectionProps {
  formData: CompanyFormData;
  errors: Record<string, string>;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
}

export function BasicInformationSection({
  formData,
  errors,
  onNameChange,
  onSlugChange,
}: BasicInformationSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">1</Badge>
        <h3 className="font-semibold text-sm">Basic Information</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company-name" className="text-xs font-medium">
            Business Name *
          </Label>
          <Input
            id="company-name"
            value={formData.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Acme Inc"
            className="mt-1.5"
            maxLength={160}
            autoComplete="organization"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="company-slug" className="text-xs font-medium">
            URL Slug *
          </Label>
          <Input
            id="company-slug"
            value={formData.slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="e.g. acme-inc"
            className="mt-1.5 font-mono text-sm"
            maxLength={80}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
          {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug}</p>}
        </div>
      </div>
    </div>
  );
}

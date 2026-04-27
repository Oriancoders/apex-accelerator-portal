import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyFormData } from "./types";
import { BUSINESS_TYPES } from "./constants";

interface BusinessDetailsSectionProps {
  formData: CompanyFormData;
  errors: Record<string, string>;
  onBusinessTypeChange: (value: string) => void;
  onAnnualTurnoverChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
}

export function BusinessDetailsSection({
  formData,
  errors,
  onBusinessTypeChange,
  onAnnualTurnoverChange,
  onWebsiteChange,
}: BusinessDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">2</Badge>
        <h3 className="font-semibold text-sm">Business Details</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="business-type" className="text-xs font-medium">
            Business Type
          </Label>
          <Select value={formData.businessType} onValueChange={onBusinessTypeChange}>
            <SelectTrigger id="business-type" className="mt-1.5">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="annual-turnover" className="text-xs font-medium">
            Annual Turnover (£)
          </Label>
          <Input
            id="annual-turnover"
            type="number"
            value={formData.annualTurnover}
            onChange={(e) => onAnnualTurnoverChange(e.target.value)}
            placeholder="e.g. 500000"
            className="mt-1.5"
            min="0"
            max="1000000000000"
            step="1"
          />
        </div>

        <div>
          <Label htmlFor="website" className="text-xs font-medium">
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => onWebsiteChange(e.target.value)}
            placeholder="https://example.com"
            className="mt-1.5"
            maxLength={2048}
            autoComplete="url"
          />
          {errors.website && <p className="text-xs text-destructive mt-1">{errors.website}</p>}
        </div>
      </div>
    </div>
  );
}

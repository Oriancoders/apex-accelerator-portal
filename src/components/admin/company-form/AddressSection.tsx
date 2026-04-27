import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyFormData } from "./types";
import { COUNTRIES } from "./constants";

interface AddressSectionProps {
  formData: CompanyFormData;
  onAddressLine1Change: (value: string) => void;
  onAddressLine2Change: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCountryChange: (value: string) => void;
}

export function AddressSection({
  formData,
  onAddressLine1Change,
  onAddressLine2Change,
  onCityChange,
  onStateChange,
  onPostalCodeChange,
  onCountryChange,
}: AddressSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">3</Badge>
        <h3 className="font-semibold text-sm">Address</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="address-line1" className="text-xs font-medium">
            Address Line 1
          </Label>
          <Input
            id="address-line1"
            value={formData.addressLine1}
            onChange={(e) => onAddressLine1Change(e.target.value)}
            placeholder="Street address"
            className="mt-1.5"
            maxLength={180}
            autoComplete="address-line1"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="address-line2" className="text-xs font-medium">
            Address Line 2
          </Label>
          <Input
            id="address-line2"
            value={formData.addressLine2}
            onChange={(e) => onAddressLine2Change(e.target.value)}
            placeholder="Apartment, suite, etc (optional)"
            className="mt-1.5"
            maxLength={180}
            autoComplete="address-line2"
          />
        </div>

        <div>
          <Label htmlFor="city" className="text-xs font-medium">
            City
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="e.g. London"
            className="mt-1.5"
            maxLength={100}
            autoComplete="address-level2"
          />
        </div>

        <div>
          <Label htmlFor="state" className="text-xs font-medium">
            State / County
          </Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="e.g. Greater London"
            className="mt-1.5"
            maxLength={100}
            autoComplete="address-level1"
          />
        </div>

        <div>
          <Label htmlFor="postal-code" className="text-xs font-medium">
            Postal Code
          </Label>
          <Input
            id="postal-code"
            value={formData.postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            placeholder="e.g. SW1A 1AA"
            className="mt-1.5"
            maxLength={20}
            autoComplete="postal-code"
          />
        </div>

        <div>
          <Label htmlFor="country" className="text-xs font-medium">
            Country
          </Label>
          <Select value={formData.country} onValueChange={onCountryChange}>
            <SelectTrigger id="country" className="mt-1.5">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

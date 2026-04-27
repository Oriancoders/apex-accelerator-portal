import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyFormData } from "./types";

interface ContactSectionProps {
  formData: CompanyFormData;
  onContactNameChange: (value: string) => void;
  onContactEmailChange: (value: string) => void;
  onContactPhoneChange: (value: string) => void;
}

export function ContactSection({
  formData,
  onContactNameChange,
  onContactEmailChange,
  onContactPhoneChange,
}: ContactSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">4</Badge>
        <h3 className="font-semibold text-sm">Contact Information</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="contact-name" className="text-xs font-medium">
            Contact Name
          </Label>
          <Input
            id="contact-name"
            value={formData.contactName}
            onChange={(e) => onContactNameChange(e.target.value)}
            placeholder="e.g. John Smith"
            className="mt-1.5"
            maxLength={120}
            autoComplete="name"
          />
        </div>

        <div>
          <Label htmlFor="contact-email" className="text-xs font-medium">
            Contact Email
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => onContactEmailChange(e.target.value)}
            placeholder="john@example.com"
            className="mt-1.5"
            maxLength={254}
            autoComplete="email"
          />
        </div>

        <div>
          <Label htmlFor="contact-phone" className="text-xs font-medium">
            Contact Phone
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => onContactPhoneChange(e.target.value)}
            placeholder="+44 20 XXXX XXXX"
            className="mt-1.5"
            maxLength={30}
            autoComplete="tel"
          />
        </div>
      </div>
    </div>
  );
}

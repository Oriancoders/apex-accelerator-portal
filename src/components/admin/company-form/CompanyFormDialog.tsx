import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { BasicInformationSection } from "./BasicInformationSection";
import { BusinessDetailsSection } from "./BusinessDetailsSection";
import { AddressSection } from "./AddressSection";
import { ContactSection } from "./ContactSection";
import { CompanyFormData, CompanyFormDialogProps } from "./types";
import { toSlug, validateForm, INITIAL_FORM_DATA } from "./utils";

export default function CompanyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CompanyFormDialogProps) {
  const [formData, setFormData] = useState<CompanyFormData>(INITIAL_FORM_DATA);
  const [manualSlug, setManualSlug] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    if (!manualSlug) {
      setFormData(prev => ({ ...prev, slug: toSlug(value) }));
    }
  };

  const handleSlugChange = (value: string) => {
    setManualSlug(true);
    setFormData(prev => ({ ...prev, slug: toSlug(value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm(formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setManualSlug(false);
    setErrors({});
  };

  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Company
          </DialogTitle>
          <DialogDescription>
            Fill in company details. Only Business Name and Slug are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInformationSection
            formData={formData}
            errors={errors}
            onNameChange={handleNameChange}
            onSlugChange={handleSlugChange}
          />

          <BusinessDetailsSection
            formData={formData}
            errors={errors}
            onBusinessTypeChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
            onAnnualTurnoverChange={(value) => setFormData(prev => ({ ...prev, annualTurnover: value }))}
            onWebsiteChange={(value) => setFormData(prev => ({ ...prev, website: value }))}
          />

          <AddressSection
            formData={formData}
            onAddressLine1Change={(value) => setFormData(prev => ({ ...prev, addressLine1: value }))}
            onAddressLine2Change={(value) => setFormData(prev => ({ ...prev, addressLine2: value }))}
            onCityChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
            onStateChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
            onPostalCodeChange={(value) => setFormData(prev => ({ ...prev, postalCode: value }))}
            onCountryChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
          />

          <ContactSection
            formData={formData}
            onContactNameChange={(value) => setFormData(prev => ({ ...prev, contactName: value }))}
            onContactEmailChange={(value) => setFormData(prev => ({ ...prev, contactEmail: value }))}
            onContactPhoneChange={(value) => setFormData(prev => ({ ...prev, contactPhone: value }))}
          />

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

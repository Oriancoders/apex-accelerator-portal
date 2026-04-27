export interface CompanyFormData {
  name: string;
  slug: string;
  businessType: string;
  annualTurnover: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CompanyFormData) => void;
  isLoading?: boolean;
}

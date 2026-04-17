import AdminLayout from "@/components/AdminLayout";
import CompanySelectorCard from "@/pages/admin/company-components/CompanySelectorCard";
import VisibilityCard from "@/pages/admin/company-components/VisibilityCard";
import { useAdminCompanyComponentsPage } from "@/pages/admin/company-components/useAdminCompanyComponentsPage";

export default function AdminCompanyComponentsPage() {
  const {
    companyId,
    setCompanyId,
    companies,
    selectedCompany,
    visibilityMap,
    visibilityLoading,
    toggleMutation,
  } = useAdminCompanyComponentsPage();

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Company Component Toggles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control general vs company-specific dashboard modules for each tenant.
          </p>
        </div>

        <CompanySelectorCard
          companyId={companyId}
          companies={companies}
          onCompanyChange={setCompanyId}
        />

        {selectedCompany && (
          <VisibilityCard
            selectedCompany={selectedCompany}
            visibilityMap={visibilityMap}
            visibilityLoading={visibilityLoading}
            togglePending={toggleMutation.isPending}
            onToggle={(args) => toggleMutation.mutate(args)}
          />
        )}
      </div>
    </AdminLayout>
  );
}

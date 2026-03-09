import { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Star, X, Package } from "lucide-react";

const products = [
  { name: "Salesforce Inspector Reloaded", rating: 4.9, url: "https://appexchange.salesforce.com", desc: "Debug & explore your org data, run SOQL queries and export results instantly.", category: "Developer Tools" },
  { name: "Dataloader.io", rating: 4.7, url: "https://appexchange.salesforce.com", desc: "Bulk data import, export, update and delete operations for Salesforce.", category: "Data Management" },
  { name: "OwnBackup", rating: 4.8, url: "https://appexchange.salesforce.com", desc: "Automated backup and recovery for all your Salesforce data and metadata.", category: "Data Management" },
  { name: "Conga Composer", rating: 4.6, url: "https://appexchange.salesforce.com", desc: "Generate professional documents, proposals and agreements from Salesforce data.", category: "Productivity" },
  { name: "Cirrus Insight", rating: 4.5, url: "https://appexchange.salesforce.com", desc: "Seamlessly integrate Gmail and Outlook with Salesforce for email tracking.", category: "Integration" },
  { name: "Salesforce Maps", rating: 4.4, url: "https://appexchange.salesforce.com", desc: "Location intelligence and territory management for field sales teams.", category: "Sales" },
  { name: "TaskRay", rating: 4.7, url: "https://appexchange.salesforce.com", desc: "Project management and customer onboarding natively inside Salesforce.", category: "Productivity" },
  { name: "Pardot (Marketing Cloud Account Engagement)", rating: 4.5, url: "https://appexchange.salesforce.com", desc: "B2B marketing automation to drive leads and align sales and marketing.", category: "Marketing" },
  { name: "Copado", rating: 4.6, url: "https://appexchange.salesforce.com", desc: "DevOps platform for Salesforce — CI/CD, version control, and release management.", category: "Developer Tools" },
  { name: "FormAssembly", rating: 4.6, url: "https://appexchange.salesforce.com", desc: "Build forms and workflows that connect directly to Salesforce records.", category: "Productivity" },
  { name: "Apttus CPQ", rating: 4.4, url: "https://appexchange.salesforce.com", desc: "Configure, Price, Quote solution to streamline the complex sales process.", category: "Sales" },
  { name: "Veeam Backup for Salesforce", rating: 4.5, url: "https://appexchange.salesforce.com", desc: "Enterprise-grade backup and disaster recovery for Salesforce orgs.", category: "Data Management" },
];

const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

export default function AppExchangePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <ProtectedLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-10 sm:px-10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">AppExchange</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
              Top AppExchange Products
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mb-6">
              Curated list of the most popular and highest-rated Salesforce AppExchange apps trusted by thousands of orgs.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search apps, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-background/70 backdrop-blur border-border"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                category === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              {cat}
              {cat !== "All" && (
                <span className="opacity-70">({products.filter((p) => p.category === cat).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground">Try a different search or category.</p>
            <button
              className="mt-4 text-sm text-primary hover:underline"
              onClick={() => { setSearch(""); setCategory("All"); }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card hover:shadow-md hover:border-primary/25 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      <span className="text-xs font-bold text-foreground">{p.rating}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
                <div>
                  <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {p.category}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

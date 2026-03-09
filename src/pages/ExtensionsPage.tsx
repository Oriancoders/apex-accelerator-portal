import { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Chrome, X } from "lucide-react";

const extensions = [
  {
    name: "Salesforce Inspector Reloaded",
    desc: "Inspect data, run SOQL queries, export results and navigate records directly from your browser.",
    url: "https://chrome.google.com/webstore",
    category: "Developer Tools",
    users: "400K+",
  },
  {
    name: "Salesforce DevTools",
    desc: "Debug logs explorer, schema browser, and real-time event monitoring all in one Chrome extension.",
    url: "https://chrome.google.com/webstore",
    category: "Developer Tools",
    users: "150K+",
  },
  {
    name: "ORGanizer for Salesforce",
    desc: "Multi-org management with quick links, org notes, and instant switching between sandboxes and production.",
    url: "https://chrome.google.com/webstore",
    category: "Productivity",
    users: "200K+",
  },
  {
    name: "Salesforce Colored Favicons",
    desc: "Identify your Salesforce orgs instantly with custom color-coded browser tab favicons.",
    url: "https://chrome.google.com/webstore",
    category: "Productivity",
    users: "100K+",
  },
  {
    name: "Apex PMD",
    desc: "Static code analysis for Apex directly in Chrome — catch bugs and code quality issues before deployment.",
    url: "https://chrome.google.com/webstore",
    category: "Developer Tools",
    users: "50K+",
  },
  {
    name: "Salesforce Mass Edit & Mass Update",
    desc: "Mass edit and update Salesforce records inline — like a spreadsheet, without leaving the list view.",
    url: "https://chrome.google.com/webstore",
    category: "Data Management",
    users: "80K+",
  },
  {
    name: "Salesforce.com Quick Login As",
    desc: "Quickly login as any user in your org for testing and support — saves hours compared to the native approach.",
    url: "https://chrome.google.com/webstore",
    category: "Admin Tools",
    users: "120K+",
  },
  {
    name: "Salesforce Field Audit",
    desc: "See field history, audit trail, and data changes for any Salesforce record in a clean timeline view.",
    url: "https://chrome.google.com/webstore",
    category: "Admin Tools",
    users: "60K+",
  },
  {
    name: "Salesforce Metadata Search",
    desc: "Search across all metadata types in your org — find where a field is used across flows, triggers, and layouts.",
    url: "https://chrome.google.com/webstore",
    category: "Developer Tools",
    users: "70K+",
  },
  {
    name: "Lightning Extension",
    desc: "Debug Lightning components, view component trees, and analyze performance metrics in Salesforce Lightning.",
    url: "https://chrome.google.com/webstore",
    category: "Developer Tools",
    users: "90K+",
  },
];

const categories = ["All", ...Array.from(new Set(extensions.map((e) => e.category)))];

export default function ExtensionsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = extensions.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.desc.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || e.category === category;
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
                <Chrome className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Chrome Extensions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
              Essential Chrome Extensions
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mb-6">
              The best Chrome extensions for Salesforce admins, developers and architects to supercharge your daily workflow.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search extensions, categories..."
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
                <span className="opacity-70">({extensions.filter((e) => e.category === cat).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Extensions grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Chrome className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No extensions found</h3>
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
            {filtered.map((e) => (
              <a
                key={e.name}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card hover:shadow-md hover:border-primary/25 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Chrome className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{e.users} users</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1">
                    {e.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{e.desc}</p>
                </div>
                <div>
                  <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {e.category}
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

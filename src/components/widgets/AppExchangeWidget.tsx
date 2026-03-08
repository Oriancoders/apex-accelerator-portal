import { ExternalLink, Star } from "lucide-react";

const products = [
  { name: "Salesforce Inspector Reloaded", rating: 4.9, url: "https://appexchange.salesforce.com", desc: "Debug & explore data" },
  { name: "Dataloader.io", rating: 4.7, url: "https://appexchange.salesforce.com", desc: "Bulk data operations" },
  { name: "OwnBackup", rating: 4.8, url: "https://appexchange.salesforce.com", desc: "Backup & restore" },
  { name: "Conga Composer", rating: 4.6, url: "https://appexchange.salesforce.com", desc: "Document generation" },
  { name: "Cirrus Insight", rating: 4.5, url: "https://appexchange.salesforce.com", desc: "Email integration" },
];

export default function AppExchangeWidget() {
  return (
    <div className="widget-card">
      <div className="widget-card-header">
        <h3 className="font-semibold text-sm text-foreground">Top AppExchange Products</h3>
        <a href="https://appexchange.salesforce.com" target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">View All</a>
      </div>
      <div className="widget-card-body space-y-3">
        {products.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-accent text-accent" />
                <span className="text-xs font-medium text-foreground">{p.rating}</span>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

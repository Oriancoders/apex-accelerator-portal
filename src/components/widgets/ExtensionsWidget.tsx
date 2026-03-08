import { Chrome, ExternalLink } from "lucide-react";

const extensions = [
  { name: "Salesforce Inspector Reloaded", desc: "Inspect data, run SOQL, export results", url: "https://chrome.google.com/webstore" },
  { name: "Salesforce DevTools", desc: "Debug logs, schema explorer", url: "https://chrome.google.com/webstore" },
  { name: "ORGanizer for Salesforce", desc: "Multi-org management & quick links", url: "https://chrome.google.com/webstore" },
  { name: "Salesforce Colored Favicons", desc: "Identify orgs by color-coded tabs", url: "https://chrome.google.com/webstore" },
];

export default function ExtensionsWidget() {
  return (
    <div className="widget-card">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <Chrome className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Chrome Extensions</h3>
        </div>
      </div>
      <div className="widget-card-body space-y-2">
        {extensions.map((e) => (
          <a key={e.name} href={e.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between p-2 rounded-lg hover:bg-muted transition-colors group">
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{e.name}</p>
              <p className="text-xs text-muted-foreground">{e.desc}</p>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

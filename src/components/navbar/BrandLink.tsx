import { Link } from "react-router-dom";
import { Cloud as CloudIcon } from "lucide-react";

export default function BrandLink() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
        <CloudIcon className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="font-bold text-foreground text-base hidden sm:inline tracking-tight">Customer Connect</span>
    </Link>
  );
}

import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil, Trash2, ExternalLink, Star, Package, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Static data - in production this would come from database
const initialProducts = [
  { id: "1", name: "Salesforce Inspector Reloaded", rating: 4.9, url: "https://appexchange.salesforce.com", desc: "Debug & explore your org data, run SOQL queries and export results instantly.", category: "Developer Tools" },
  { id: "2", name: "Dataloader.io", rating: 4.7, url: "https://appexchange.salesforce.com", desc: "Bulk data import, export, update and delete operations for Salesforce.", category: "Data Management" },
  { id: "3", name: "OwnBackup", rating: 4.8, url: "https://appexchange.salesforce.com", desc: "Automated backup and recovery for all your Salesforce data and metadata.", category: "Data Management" },
  { id: "4", name: "Conga Composer", rating: 4.6, url: "https://appexchange.salesforce.com", desc: "Generate professional documents, proposals and agreements from Salesforce data.", category: "Productivity" },
  { id: "5", name: "Cirrus Insight", rating: 4.5, url: "https://appexchange.salesforce.com", desc: "Seamlessly integrate Gmail and Outlook with Salesforce for email tracking.", category: "Integration" },
  { id: "6", name: "Salesforce Maps", rating: 4.4, url: "https://appexchange.salesforce.com", desc: "Location intelligence and territory management for field sales teams.", category: "Sales" },
  { id: "7", name: "TaskRay", rating: 4.7, url: "https://appexchange.salesforce.com", desc: "Project management and customer onboarding natively inside Salesforce.", category: "Productivity" },
  { id: "8", name: "Pardot (Marketing Cloud Account Engagement)", rating: 4.5, url: "https://appexchange.salesforce.com", desc: "B2B marketing automation to drive leads and align sales and marketing.", category: "Marketing" },
  { id: "9", name: "Copado", rating: 4.6, url: "https://appexchange.salesforce.com", desc: "DevOps platform for Salesforce — CI/CD, version control, and release management.", category: "Developer Tools" },
  { id: "10", name: "FormAssembly", rating: 4.6, url: "https://appexchange.salesforce.com", desc: "Build forms and workflows that connect directly to Salesforce records.", category: "Productivity" },
  { id: "11", name: "Apttus CPQ", rating: 4.4, url: "https://appexchange.salesforce.com", desc: "Configure, Price, Quote solution to streamline the complex sales process.", category: "Sales" },
  { id: "12", name: "Veeam Backup for Salesforce", rating: 4.5, url: "https://appexchange.salesforce.com", desc: "Enterprise-grade backup and disaster recovery for Salesforce orgs.", category: "Data Management" },
];

const categories = ["Developer Tools", "Data Management", "Productivity", "Integration", "Sales", "Marketing"];

type Product = typeof initialProducts[0];

export default function AdminAppExchangePage() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", desc: "", url: "", rating: "4.5", category: "Developer Tools" });

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({ name: product.name, desc: product.desc, url: product.url, rating: String(product.rating), category: product.category });
    } else {
      setEditingProduct(null);
      setForm({ name: "", desc: "", url: "", rating: "4.5", category: "Developer Tools" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.desc || !form.url) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...form, rating: parseFloat(form.rating) } : p)));
      toast.success("Product updated successfully");
    } else {
      const newProduct: Product = {
        id: String(Date.now()),
        name: form.name,
        desc: form.desc,
        url: form.url,
        rating: parseFloat(form.rating),
        category: form.category,
      };
      setProducts([newProduct, ...products]);
      toast.success("Product added successfully");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Product deleted");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">AppExchange Products</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage recommended AppExchange products</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Short description" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>URL *</Label>
                  <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://appexchange.salesforce.com/..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <Input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>{editingProduct ? "Save Changes" : "Add Product"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-foreground">
                {(products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Top Category</p>
              <p className="text-lg font-bold text-foreground truncate">
                {categories.reduce((a, b) =>
                  products.filter((p) => p.category === a).length >= products.filter((p) => p.category === b).length ? a : b
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Products ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No products found</p>
                </div>
              ) : (
                filtered.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{product.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      <span className="text-sm font-semibold text-foreground">{product.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={product.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

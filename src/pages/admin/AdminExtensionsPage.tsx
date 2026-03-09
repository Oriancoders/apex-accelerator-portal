import { useAdminCrud } from "@/hooks/useAdminCrud";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/shared/PageHeader";
import SearchInput from "@/shared/SearchInput";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, Globe, Users, Chrome } from "lucide-react";

interface Extension {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  users_count: string;
  published: boolean;
  created_at: string;
}

interface ExtensionForm {
  name: string;
  description: string;
  url: string;
  category: string;
  users_count: string;
  published: boolean;
}

const defaultForm: ExtensionForm = { name: "", description: "", url: "", category: "Developer Tools", users_count: "", published: true };

export default function AdminExtensionsPage() {
  const crud = useAdminCrud<Extension, ExtensionForm>({
    queryKey: "admin-extensions",
    table: "extensions",
    searchColumns: ["name", "category"],
    defaultForm,
    toForm: (item) => ({
      name: item.name,
      description: item.description,
      url: item.url,
      category: item.category,
      users_count: item.users_count || "",
      published: item.published,
    }),
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="Manage Extensions"
          subtitle={`${crud.items.length} Chrome extensions`}
          action={
            <Button onClick={crud.openNew} className="gap-2 h-11 rounded-xl font-semibold">
              <Plus className="h-4 w-4" /> Add Extension
            </Button>
          }
        />

        <Card className="rounded-2xl">
          <CardHeader className="px-4 sm:px-6">
            <SearchInput value={crud.search} onChange={crud.setSearch} placeholder="Search extensions..." />
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {crud.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : crud.filtered.length === 0 ? (
              <div className="text-center py-12">
                <Chrome className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No extensions found</p>
              </div>
            ) : (
              <div className="space-y-3 px-4 sm:px-0">
                {crud.filtered.map((item) => (
                  <Card key={item.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                          {item.published ? (
                            <Badge variant="secondary" className="text-[10px] gap-1"><Eye className="h-3 w-3" /> Live</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1"><EyeOff className="h-3 w-3" /> Draft</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                          {item.users_count && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" /> {item.users_count}
                            </span>
                          )}
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                              <Globe className="h-3 w-3" /> Link
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => crud.openEdit(item)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => crud.deleteMutation.mutate(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={crud.dialogOpen} onOpenChange={(open) => !open && crud.closeDialog()}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{crud.editing ? "Edit Extension" : "Add Extension"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={crud.form.name} onChange={(e) => crud.updateForm({ name: e.target.value })} required className="mt-1 h-11 rounded-xl" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={crud.form.description} onChange={(e) => crud.updateForm({ description: e.target.value })} required className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input value={crud.form.category} onChange={(e) => crud.updateForm({ category: e.target.value })} required className="mt-1 h-11 rounded-xl" />
              </div>
              <div>
                <Label>Users Count</Label>
                <Input value={crud.form.users_count} onChange={(e) => crud.updateForm({ users_count: e.target.value })} placeholder="e.g. 100K+" className="mt-1 h-11 rounded-xl" />
              </div>
            </div>
            <div>
              <Label>URL</Label>
              <Input value={crud.form.url} onChange={(e) => crud.updateForm({ url: e.target.value })} className="mt-1 h-11 rounded-xl" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={crud.form.published} onCheckedChange={(v) => crud.updateForm({ published: v })} />
              <Label>Published</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={crud.closeDialog} className="rounded-xl">Cancel</Button>
            <Button onClick={() => crud.saveMutation.mutate()} disabled={!crud.form.name || !crud.form.description || crud.saveMutation.isPending} className="rounded-xl">
              {crud.saveMutation.isPending ? "Saving..." : crud.editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

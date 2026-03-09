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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, Globe } from "lucide-react";
import { format } from "date-fns";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  category: string;
  published: boolean;
  created_at: string;
}

interface NewsForm {
  title: string;
  summary: string;
  url: string;
  category: string;
  published: boolean;
}

const defaultForm: NewsForm = { title: "", summary: "", url: "", category: "General", published: true };

export default function AdminNewsPage() {
  const crud = useAdminCrud<NewsItem, NewsForm>({
    queryKey: "admin-news",
    table: "news_items",
    searchColumns: ["title", "category"],
    defaultForm,
    toForm: (item) => ({
      title: item.title,
      summary: item.summary,
      url: item.url,
      category: item.category,
      published: item.published,
    }),
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="Manage News"
          subtitle={`${crud.items.length} news items`}
          action={
            <Button onClick={crud.openNew} className="gap-2 h-11 rounded-xl font-semibold">
              <Plus className="h-4 w-4" /> Add News
            </Button>
          }
        />

        <Card className="rounded-2xl">
          <CardHeader className="px-4 sm:px-6">
            <SearchInput value={crud.search} onChange={crud.setSearch} placeholder="Search news..." />
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {crud.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-3 px-4 sm:px-0">
                {crud.filtered.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No news found</div>
                ) : (
                  crud.filtered.map((item) => (
                    <Card key={item.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                            {item.published ? (
                              <Badge variant="secondary" className="text-[10px] gap-1"><Eye className="h-3 w-3" /> Live</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] gap-1"><EyeOff className="h-3 w-3" /> Draft</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.summary}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
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
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={crud.dialogOpen} onOpenChange={(open) => !open && crud.closeDialog()}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{crud.editing ? "Edit News" : "Add News"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={crud.form.title} onChange={(e) => crud.updateForm({ title: e.target.value })} required className="mt-1 h-11 rounded-xl" />
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea value={crud.form.summary} onChange={(e) => crud.updateForm({ summary: e.target.value })} required className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input value={crud.form.category} onChange={(e) => crud.updateForm({ category: e.target.value })} required className="mt-1 h-11 rounded-xl" />
              </div>
              <div>
                <Label>URL</Label>
                <Input value={crud.form.url} onChange={(e) => crud.updateForm({ url: e.target.value })} className="mt-1 h-11 rounded-xl" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={crud.form.published} onCheckedChange={(v) => crud.updateForm({ published: v })} />
              <Label>Published</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={crud.closeDialog} className="rounded-xl">Cancel</Button>
            <Button onClick={() => crud.saveMutation.mutate()} disabled={!crud.form.title || !crud.form.summary || crud.saveMutation.isPending} className="rounded-xl">
              {crud.saveMutation.isPending ? "Saving..." : crud.editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

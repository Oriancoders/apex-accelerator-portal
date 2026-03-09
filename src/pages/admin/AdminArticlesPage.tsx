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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Article = Tables<"articles">;

const categories = [
  "best-practices", "how-to", "architecture", "integration",
  "security", "performance", "recipe", "news",
];

interface ArticleForm {
  title: string;
  category: string;
  content: string;
  author: string;
  tags: string;
  published: boolean;
}

const defaultForm: ArticleForm = {
  title: "", category: "best-practices", content: "", author: "", tags: "", published: true,
};

export default function AdminArticlesPage() {
  const crud = useAdminCrud<Article, ArticleForm>({
    queryKey: "admin-articles",
    table: "articles",
    searchColumns: ["title", "category"],
    defaultForm,
    toPayload: (f) => ({
      title: f.title,
      category: f.category,
      content: f.content,
      author: f.author || null,
      tags: f.tags ? f.tags.split(",").map((t) => t.trim()) : null,
      published: f.published,
    }),
    toForm: (item) => ({
      title: item.title,
      category: item.category,
      content: item.content,
      author: item.author || "",
      tags: item.tags?.join(", ") || "",
      published: item.published ?? true,
    }),
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="Manage Articles"
          subtitle={`${crud.items.length} articles`}
          action={
            <Button onClick={crud.openNew} className="gap-2 h-11 rounded-xl font-semibold self-start sm:self-auto">
              <Plus className="h-4 w-4" /> New Article
            </Button>
          }
        />

        <Card className="rounded-2xl">
          <CardHeader className="px-4 sm:px-6">
            <SearchInput value={crud.search} onChange={crud.setSearch} placeholder="Search articles..." />
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {crud.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crud.filtered.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium max-w-[250px] truncate">{article.title}</TableCell>
                          <TableCell><Badge variant="secondary">{article.category}</Badge></TableCell>
                          <TableCell className="text-sm">{article.author || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={article.published ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"}>
                              {article.published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(article.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => crud.openEdit(article)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => { if (confirm("Delete this article?")) crud.deleteMutation.mutate(article.id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {crud.filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No articles found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden space-y-2 px-4">
                  {crud.filtered.map((article) => (
                    <div key={article.id} className="p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => crud.openEdit(article)}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground line-clamp-2 flex-1">{article.title}</p>
                        <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${article.published ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"}`}>
                          {article.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">{article.category}</Badge>
                        <span className="text-xs text-muted-foreground">{article.author || ""}</span>
                      </div>
                    </div>
                  ))}
                  {crud.filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">No articles found</div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={crud.dialogOpen} onOpenChange={(open) => !open && crud.closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{crud.editing ? "Edit Article" : "New Article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Title</Label>
              <Input value={crud.form.title} onChange={(e) => crud.updateForm({ title: e.target.value })} placeholder="Article title" className="h-11 rounded-xl mt-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Category</Label>
                <Select value={crud.form.category} onValueChange={(v) => crud.updateForm({ category: v })}>
                  <SelectTrigger className="h-11 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c} value={c}>{c.replace("-", " ")}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Author</Label>
                <Input value={crud.form.author} onChange={(e) => crud.updateForm({ author: e.target.value })} placeholder="Author name" className="h-11 rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Content</Label>
              <Textarea value={crud.form.content} onChange={(e) => crud.updateForm({ content: e.target.value })} placeholder="Write the article content..." rows={10} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-sm">Tags (comma-separated)</Label>
              <Input value={crud.form.tags} onChange={(e) => crud.updateForm({ tags: e.target.value })} placeholder="e.g. flows, apex, best-practice" className="h-11 rounded-xl mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={crud.form.published} onCheckedChange={(v) => crud.updateForm({ published: v })} />
              <Label className="text-sm">Published</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={crud.closeDialog} className="rounded-xl">Cancel</Button>
            <Button onClick={() => crud.saveMutation.mutate()} disabled={!crud.form.title || !crud.form.content || crud.saveMutation.isPending} className="rounded-xl">
              {crud.saveMutation.isPending ? "Saving..." : crud.editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Plus, Edit, Trash2, Zap, Settings } from "lucide-react";
import TipTapEditor from "@/components/TipTapEditor";
import type { Tables } from "@/integrations/supabase/types";

type Article = Tables<"articles">;

const RECIPE_CATEGORIES = [
  { value: "recipe",    label: "Recipe",    icon: Settings },
  { value: "quick_win", label: "Quick Win", icon: Zap },
];

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  recipe:    { label: "Recipe",    color: "text-accent",   bg: "bg-accent/10" },
  quick_win: { label: "Quick Win", color: "text-warning",  bg: "bg-warning/10" },
};

function categoryBadge(cat: string) {
  const m = CATEGORY_META[cat];
  if (!m) return <Badge variant="secondary">{cat}</Badge>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.bg} ${m.color}`}>
      {m.label}
    </span>
  );
}

export default function AdminRecipesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("recipe");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(true);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-recipes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .in("category", ["recipe", "quick_win"])
        .order("created_at", { ascending: false });
      return (data || []) as Article[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        category,
        content,
        author: author || null,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
        published,
      };
      if (editing) {
        const { error } = await supabase.from("articles").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Recipe updated" : "Recipe created");
      queryClient.invalidateQueries({ queryKey: ["admin-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipes-page"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-widget"] });
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recipe deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipes-page"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openNew = () => {
    setEditing(null);
    setTitle("");
    setCategory("recipe");
    setContent("");
    setAuthor("");
    setTags("");
    setPublished(true);
    setDialogOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditing(article);
    setTitle(article.title);
    setCategory(article.category);
    setContent(article.content);
    setAuthor(article.author || "");
    setTags(article.tags?.join(", ") || "");
    setPublished(article.published ?? true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Recipes & Quick Wins</h1>
            <p className="text-sm text-muted-foreground mt-1">{articles.length} recipe{articles.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={openNew} className="gap-2 h-11 rounded-xl font-semibold self-start sm:self-auto">
            <Plus className="h-4 w-4" /> New Recipe
          </Button>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="px-4 sm:px-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium max-w-[240px] truncate">{article.title}</TableCell>
                          <TableCell>{categoryBadge(article.category)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{article.author || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={article.published
                                ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                                : "bg-muted text-muted-foreground"}
                            >
                              {article.published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(article.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(article)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-9 w-9 text-destructive"
                                onClick={() => { if (confirm("Delete this recipe?")) deleteMutation.mutate(article.id); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No recipes found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden space-y-2 px-4">
                  {filtered.map((article) => (
                    <div
                      key={article.id}
                      className="p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => openEdit(article)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground line-clamp-2 flex-1">{article.title}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] flex-shrink-0 ${article.published
                            ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                            : "bg-muted text-muted-foreground"}`}
                        >
                          {article.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {categoryBadge(article.category)}
                        <span className="text-xs text-muted-foreground">{article.author || ""}</span>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">No recipes found</div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              {editing ? "Edit Recipe" : "New Recipe"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Recipe title"
                className="h-11 rounded-xl mt-1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Type</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECIPE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <c.icon className="h-3.5 w-3.5" />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Author</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                  className="h-11 rounded-xl mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1 block">Content</Label>
              <TipTapEditor content={content} onChange={setContent} />
            </div>
            <div>
              <Label className="text-sm">Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. flows, apex, formula"
                className="h-11 rounded-xl mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={published} onCheckedChange={setPublished} />
              <Label className="text-sm">Published</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl">Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!title || !content || saveMutation.isPending}
              className="rounded-xl"
            >
              {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

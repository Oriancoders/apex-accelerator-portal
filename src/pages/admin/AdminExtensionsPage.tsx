import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Plus, Pencil, Trash2, Search, Globe, Eye, EyeOff, Users } from "lucide-react";
import { motion } from "framer-motion";

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

const defaultForm = { name: "", description: "", url: "", category: "Developer Tools", users_count: "", published: true };

export default function AdminExtensionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Extension | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: extensions = [], isLoading } = useQuery({
    queryKey: ["admin-extensions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extensions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Extension[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: typeof form & { id?: string }) => {
      if (item.id) {
        const { error } = await supabase.from("extensions").update({
          name: item.name, description: item.description, url: item.url,
          category: item.category, users_count: item.users_count, published: item.published,
        }).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("extensions").insert({
          name: item.name, description: item.description, url: item.url,
          category: item.category, users_count: item.users_count, published: item.published,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-extensions"] });
      toast({ title: editing ? "Extension updated" : "Extension created" });
      closeDialog();
    },
    onError: () => toast({ title: "Error saving extension", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("extensions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-extensions"] });
      toast({ title: "Extension deleted" });
    },
    onError: () => toast({ title: "Error deleting extension", variant: "destructive" }),
  });

  const openCreate = () => { setEditing(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (item: Extension) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description, url: item.url, category: item.category, users_count: item.users_count || "", published: item.published });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(defaultForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  const filtered = extensions.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const publishedCount = extensions.filter((e) => e.published).length;
  const categories = [...new Set(extensions.map((e) => e.category))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Manage Extensions</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage Chrome extension recommendations</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Extensions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-foreground">{extensions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-foreground">{publishedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-foreground">{categories.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search extensions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 rounded-xl" />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="rounded-xl h-10">
                <Plus className="h-4 w-4 mr-2" /> Add Extension
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Extension" : "Add Extension"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="mt-1" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="mt-1" />
                  </div>
                  <div>
                    <Label>Users Count</Label>
                    <Input value={form.users_count} onChange={(e) => setForm({ ...form, users_count: e.target.value })} placeholder="e.g. 100K+" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>URL</Label>
                  <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                  <Label>Published</Label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Extensions list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Chrome className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No extensions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

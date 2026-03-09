/**
 * Generic CRUD hook for admin pages that follow the pattern:
 * - fetch list from a supabase table
 * - search/filter
 * - create/edit via dialog
 * - delete
 *
 * Eliminates ~80% of boilerplate across AdminArticles, AdminNews,
 * AdminExtensions, AdminRecipes pages.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseAdminCrudOptions<T, F> {
  /** React-query cache key */
  queryKey: string;
  /** Supabase table name */
  table: string;
  /** Column(s) to search across */
  searchColumns: (keyof T)[];
  /** Default form values for creating a new item */
  defaultForm: F;
  /** Optionally filter rows (e.g. category IN ...) */
  queryFilter?: (query: any) => any;
  /** Extra query keys to invalidate on save/delete */
  extraInvalidateKeys?: string[];
  /** Map form → insert/update payload */
  toPayload?: (form: F) => Record<string, any>;
  /** Map row → form (for editing) */
  toForm?: (item: T) => F;
}

export function useAdminCrud<T extends { id: string }, F extends Record<string, any>>(
  options: UseAdminCrudOptions<T, F>
) {
  const {
    queryKey,
    table,
    searchColumns,
    defaultForm,
    queryFilter,
    extraInvalidateKeys = [],
    toPayload = (f) => f as any,
    toForm = (item) => item as unknown as F,
  } = options;

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<F>(defaultForm);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const { data: items = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      let q = (supabase as any).from(table).select("*").order("created_at", { ascending: false });
      if (queryFilter) q = queryFilter(q);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as T[];
    },
  });

  // ── Filtered ───────────────────────────────────────────────────────────
  const filtered = items.filter((item) =>
    searchColumns.some((col) =>
      String((item as any)[col] || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  );

  // ── Save (create or update) ────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = toPayload(form);
      if (editing) {
        const { error } = await (supabase as any).from(table).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from(table).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Updated successfully" : "Created successfully");
      invalidateAll();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Delete ─────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted successfully");
      invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Dialog helpers ─────────────────────────────────────────────────────
  const openNew = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    setForm(toForm(item));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const updateForm = (partial: Partial<F>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  // ── Cache invalidation ─────────────────────────────────────────────────
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
    extraInvalidateKeys.forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  return {
    items,
    filtered,
    isLoading,
    search,
    setSearch,
    dialogOpen,
    setDialogOpen,
    editing,
    form,
    setForm,
    updateForm,
    saveMutation,
    deleteMutation,
    openNew,
    openEdit,
    closeDialog,
  };
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data.data as any[],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/categories", {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        parentId: parentId || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setName("");
      setSlug("");
      setParentId("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Categories</h1>
        <button onClick={() => setFormOpen(true)} className="btn-primary">
          <Plus size={16} className="me-2" />
          New category
        </button>
      </div>

      <div className="card-surface divide-y divide-border">
        {isLoading && <p className="p-6 text-center text-muted">Loading…</p>}
        {categories?.map((main) => (
          <div key={main.id}>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-ink">{main.name}</p>
                <p className="text-xs text-muted">/{main.slug}</p>
              </div>
              <button
                onClick={() => confirm(`Delete "${main.name}" and all its subcategories?`) && deleteMutation.mutate(main.id)}
                className="rounded p-1.5 text-danger hover:bg-canvas"
                aria-label={`Delete ${main.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            {!!main.children?.length && (
              <ul className="border-t border-border bg-canvas/60">
                {main.children.map((sub: any) => (
                  <li key={sub.id} className="flex items-center justify-between ps-10 pe-5 py-3 text-sm">
                    <div>
                      <p className="text-ink">{sub.name}</p>
                      <p className="text-xs text-muted">/{sub.slug}</p>
                    </div>
                    <button
                      onClick={() => confirm(`Delete "${sub.name}"?`) && deleteMutation.mutate(sub.id)}
                      className="rounded p-1.5 text-danger hover:bg-white"
                      aria-label={`Delete ${sub.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {categories?.length === 0 && <p className="p-6 text-center text-muted">No categories yet.</p>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">New category</h2>
              <button onClick={() => setFormOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Parent category (optional)</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">None — this is a main category</option>
                  {categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted">
                  Leave empty to create a new main category, or pick one to add a subcategory under it.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Slug (optional)</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated from name"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary w-full">
                {createMutation.isPending ? "Saving…" : "Create category"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

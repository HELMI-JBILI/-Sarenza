import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, UploadCloud, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { api } from "@/lib/api";

interface AdFormState {
  id?: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  imagePublicId: string;
  isActive: boolean;
}

const emptyForm: AdFormState = {
  title: "",
  description: "",
  link: "",
  imageUrl: "",
  imagePublicId: "",
  isActive: true,
};

export default function AdminAdvertisements() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AdFormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin", "advertisements"],
    queryFn: async () => (await api.get("/advertisements/admin")).data.data as any[],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "advertisements"] });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const { data } = await api.post("/uploads/product-image", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, imageUrl: data.data.url, imagePublicId: data.data.publicId }));
    } catch {
      alert("Image upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        imageUrl: form.imageUrl,
        link: form.link || undefined,
        isActive: form.isActive,
        displayOrder: form.id ? undefined : (ads?.length ?? 0),
      };
      if (form.id) return api.put(`/advertisements/${form.id}`, payload);
      return api.post("/advertisements", payload);
    },
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/advertisements/${id}`),
    onSuccess: invalidate,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (ad: any) => api.put(`/advertisements/${ad.id}`, { isActive: !ad.isActive }),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: async (order: { id: string; displayOrder: number }[]) =>
      api.patch("/advertisements/reorder", { order }),
    onSuccess: invalidate,
  });

  const move = (index: number, direction: -1 | 1) => {
    if (!ads) return;
    const target = index + direction;
    if (target < 0 || target >= ads.length) return;
    const reordered = [...ads];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderMutation.mutate(reordered.map((a, i) => ({ id: a.id, displayOrder: i })));
  };

  const openEdit = (ad: any) => {
    setForm({
      id: ad.id,
      title: ad.title,
      description: ad.description ?? "",
      link: ad.link ?? "",
      imageUrl: ad.imageUrl,
      imagePublicId: "",
      isActive: ad.isActive,
    });
    setFormOpen(true);
  };

  const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Advertisements</h1>
        <button
          onClick={() => {
            setForm(emptyForm);
            setFormOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} className="me-2" />
          New advertisement
        </button>
      </div>
      <p className="mb-6 text-sm text-muted">
        Only active advertisements appear in the homepage carousel, in the order shown below.
      </p>

      <div className="card-surface divide-y divide-border">
        {isLoading && <p className="p-6 text-center text-muted">Loading…</p>}
        {ads?.map((ad, i) => (
          <div key={ad.id} className="flex items-center gap-4 px-5 py-4">
            <img src={ad.imageUrl} alt={ad.title} className="h-14 w-24 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{ad.title}</p>
              {ad.description && <p className="truncate text-xs text-muted">{ad.description}</p>}
            </div>
            <button
              onClick={() => toggleActiveMutation.mutate(ad)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                ad.isActive ? "bg-success/15 text-success" : "bg-border text-muted"
              }`}
            >
              {ad.isActive ? "Active" : "Inactive"}
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded p-1.5 text-muted hover:bg-canvas disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUp size={15} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === ads.length - 1}
                className="rounded p-1.5 text-muted hover:bg-canvas disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDown size={15} />
              </button>
              <button onClick={() => openEdit(ad)} className="rounded p-1.5 hover:bg-canvas" aria-label="Edit">
                <Pencil size={15} />
              </button>
              <button
                onClick={() => confirm(`Delete "${ad.title}"?`) && deleteMutation.mutate(ad.id)}
                className="rounded p-1.5 text-danger hover:bg-canvas"
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {ads?.length === 0 && <p className="p-6 text-center text-muted">No advertisements yet.</p>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setFormOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-white p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">{form.id ? "Edit advertisement" : "New advertisement"}</h2>
              <button onClick={() => setFormOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Image</label>
                {form.imageUrl ? (
                  <div className="relative mb-2 h-32 w-full overflow-hidden rounded-lg border border-border">
                    <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: "" })}
                      className="absolute right-2 top-2 rounded-full bg-ink/60 p-1 text-white"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted hover:border-primary hover:text-primary"
                  >
                    {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                    <span className="text-xs">{uploading ? "Uploading…" : "Upload banner image"}</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Title</label>
                <input
                  required
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Description (optional)</label>
                <textarea
                  rows={2}
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Link (optional)</label>
                <input
                  type="url"
                  placeholder="https://…"
                  className={inputClass}
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active (visible in the homepage carousel)
              </label>

              <button
                type="submit"
                disabled={saveMutation.isPending || !form.imageUrl}
                className="btn-primary w-full"
              >
                {saveMutation.isPending ? "Saving…" : "Save advertisement"}
              </button>
              {!form.imageUrl && <p className="text-center text-xs text-muted">Upload an image before saving.</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

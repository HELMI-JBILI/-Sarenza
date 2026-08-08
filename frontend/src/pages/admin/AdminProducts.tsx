import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, UploadCloud, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/currency";

interface ProductImageState {
  url: string;
  publicId: string;
}

interface ProductFormState {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  mainCategoryId: string; // UI-only: narrows the subcategory dropdown
  categoryId: string; // actual subcategory (leaf) id sent to the API
  isFeatured: boolean;
  isFlashOffer: boolean;
  images: ProductImageState[];
}

const emptyForm: ProductFormState = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  mainCategoryId: "",
  categoryId: "",
  isFeatured: false,
  isFlashOffer: false,
  images: [],
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => (await api.get("/products", { params: { pageSize: 60 } })).data.data as any[],
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data.data as any[],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const { data } = await api.post("/uploads/product-image", body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setForm((prev) => ({ ...prev, images: [...prev.images, { url: data.data.url, publicId: data.data.publicId }] }));
      }
    } catch {
      alert("Image upload failed. Check that Cloudinary credentials are set in backend/.env.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (publicId: string) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img.publicId !== publicId) }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sku: form.sku,
        description: form.description,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        stock: Number(form.stock),
        categoryId: form.categoryId,
        isFeatured: form.isFeatured,
        isFlashOffer: form.isFlashOffer,
        images: form.images.length ? form.images.map((img, i) => ({ ...img, sortOrder: i })) : undefined,
      };
      if (form.id) return api.put(`/products/${form.id}`, payload);
      return api.post("/products", payload);
    },
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: invalidate,
  });

  const openEdit = (p: any) => {
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      stock: String(p.stock),
      mainCategoryId: p.category?.parent?.id ?? p.category?.id ?? "",
      categoryId: p.categoryId ?? p.category?.id ?? "",
      isFeatured: p.isFeatured,
      isFlashOffer: p.isFlashOffer,
      images: (p.images ?? []).map((img: any) => ({ url: img.url, publicId: img.publicId })),
    });
    setFormOpen(true);
  };

  const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Products</h1>
        <button
          onClick={() => {
            setForm(emptyForm);
            setFormOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} className="me-2" />
          New product
        </button>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-canvas text-start text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 text-start">Name</th>
              <th className="px-4 py-3 text-start">SKU</th>
              <th className="px-4 py-3 text-start">Price</th>
              <th className="px-4 py-3 text-start">Stock</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">Loading…</td>
              </tr>
            )}
            {products?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-3 text-muted">{p.sku}</td>
                <td className="px-4 py-3">{formatPrice(Number(p.price))}</td>
                <td className={`px-4 py-3 ${p.stock <= 10 ? "text-warning" : "text-ink"}`}>{p.stock}</td>
                <td className="px-4 py-3 text-end">
                  <button onClick={() => openEdit(p)} className="me-2 rounded p-1.5 hover:bg-canvas" aria-label="Edit">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => confirm("Delete this product?") && deleteMutation.mutate(p.id)}
                    className="rounded p-1.5 text-danger hover:bg-canvas"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setFormOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-white p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">{form.id ? "Edit product" : "New product"}</h2>
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
                <label className="mb-1 block text-xs font-medium text-muted">Name</label>
                <input
                  required
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">SKU</label>
                  <input
                    required
                    className={inputClass}
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Main category</label>
                  <select
                    required
                    className={inputClass}
                    value={form.mainCategoryId}
                    onChange={(e) => setForm({ ...form, mainCategoryId: e.target.value, categoryId: "" })}
                  >
                    <option value="">Select…</option>
                    {categories?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Subcategory</label>
                <select
                  required
                  disabled={!form.mainCategoryId}
                  className={inputClass}
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">{form.mainCategoryId ? "Select…" : "Choose a main category first"}</option>
                  {categories
                    ?.find((c: any) => c.id === form.mainCategoryId)
                    ?.children?.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Description</label>
                <textarea
                  required
                  rows={3}
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Price (TND)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Compare-at (TND)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={form.compareAtPrice}
                    onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Stock</label>
                  <input
                    required
                    type="number"
                    className={inputClass}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isFlashOffer}
                    onChange={(e) => setForm({ ...form, isFlashOffer: e.target.checked })}
                  />
                  Flash offer
                </label>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Images</label>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img) => (
                    <div key={img.publicId} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.publicId)}
                        className="absolute inset-0 flex items-center justify-center bg-ink/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted hover:border-primary hover:text-primary"
                  >
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                    <span className="text-[10px]">{uploading ? "Uploading" : "Add"}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted">
                  Uploads go to Cloudinary — requires CLOUDINARY_* keys set in backend/.env.
                </p>
              </div>
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary w-full">
                {saveMutation.isPending ? "Saving…" : "Save product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

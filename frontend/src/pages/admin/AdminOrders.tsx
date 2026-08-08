import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/currency";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning",
  CONFIRMED: "bg-royal/15 text-royal",
  PROCESSING: "bg-royal/15 text-royal",
  SHIPPED: "bg-primary/15 text-primary",
  DELIVERED: "bg-success/15 text-success",
  CANCELLED: "bg-danger/15 text-danger",
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; orderNumber: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => (await api.get("/orders")).data.data as any[],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      setPendingDelete(null);
      setDeleteError(null);
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.message || "Failed to delete this order. Please try again.");
    },
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl font-semibold text-ink">Orders</h1>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-canvas text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 text-start">Order #</th>
              <th className="px-4 py-3 text-start">Customer</th>
              <th className="px-4 py-3 text-start">City</th>
              <th className="px-4 py-3 text-start">Total</th>
              <th className="px-4 py-3 text-start">Status</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">Loading…</td>
              </tr>
            )}
            {orders?.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono text-ink">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{o.fullName}</p>
                  <p className="text-xs text-muted">{o.phone}</p>
                </td>
                <td className="px-4 py-3 text-muted">{o.city}</td>
                <td className="px-4 py-3 font-semibold text-primary">{formatPrice(Number(o.total))}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => statusMutation.mutate({ id: o.id, status: e.target.value })}
                    className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${STATUS_COLORS[o.status]}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-end">
                  {o.status === "DELIVERED" && (
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete({ id: o.id, orderNumber: o.orderNumber });
                      }}
                      className="rounded p-1.5 text-danger hover:bg-canvas"
                      aria-label={`Delete order ${o.orderNumber}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {orders?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => !deleteMutation.isPending && setPendingDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-order-title"
          >
            <h2 id="delete-order-title" className="font-display text-lg font-semibold text-ink">
              Delete this order?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Order <span className="font-mono text-ink">{pendingDelete.orderNumber}</span> will be permanently
              deleted. This cannot be undone.
            </p>
            {deleteError && <p className="mt-3 text-sm text-danger">{deleteError}</p>}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleteMutation.isPending}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(pendingDelete.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-full bg-danger px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

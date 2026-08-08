import { useQuery } from "@tanstack/react-query";
import { Package, Receipt, TrendingUp, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/currency";

export default function AdminDashboard() {
  const { data: products } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => (await api.get("/products", { params: { pageSize: 60 } })).data.data as any[],
  });
  const { data: orders } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => (await api.get("/orders")).data.data as any[],
  });

  const revenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
  const lowStock = products?.filter((p) => p.stock <= 10).length ?? 0;

  const cards = [
    { label: "Products", value: products?.length ?? "—", icon: Package },
    { label: "Orders", value: orders?.length ?? "—", icon: Receipt },
    { label: "Revenue", value: formatPrice(revenue), icon: TrendingUp },
    { label: "Low stock", value: lowStock, icon: AlertTriangle },
  ];

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl font-semibold text-ink">Overview</h1>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-surface p-6">
            <c.icon size={20} className="text-primary" />
            <p className="mt-3 text-2xl font-semibold text-ink">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 card-surface p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Recent orders</h2>
        <div className="divide-y divide-border">
          {(orders ?? []).slice(0, 6).map((o) => (
            <div key={o.id} className="flex items-center justify-between py-3 text-sm">
              <span className="font-mono text-ink">{o.orderNumber}</span>
              <span className="text-muted">{o.fullName}</span>
              <span className="font-semibold text-primary">{formatPrice(Number(o.total))}</span>
              <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink">{o.status}</span>
            </div>
          ))}
          {orders?.length === 0 && <p className="py-6 text-center text-muted">No orders yet.</p>}
        </div>
      </div>
    </div>
  );
}

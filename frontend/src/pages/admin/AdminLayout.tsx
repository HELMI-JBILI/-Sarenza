import { NavLink, Navigate, Outlet } from "react-router-dom";
import { LayoutGrid, Package, Tags, Receipt, Image, LogOut } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/advertisements", label: "Advertisements", icon: Image },
  { to: "/admin/orders", label: "Orders", icon: Receipt },
];

export default function AdminLayout() {
  const { admin, isLoading, logout } = useAdminAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-white p-6 sm:flex">
        <img src="/logo.jpeg" alt="Sarenza" className="mb-1 h-10 w-auto object-contain" />
        <span className="label-eyebrow mb-8 text-accent">Admin</span>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-canvas hover:text-ink"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-6 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-canvas hover:text-danger"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      <div className="flex-1 p-6 sm:p-10">
        <Outlet />
      </div>
    </div>
  );
}

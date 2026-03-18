import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Building2,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import Areas from "../Areas";
import Products from "../Products";
import AdminDashboard from "./AdminDashboard";
import LeaveApprovals from "./LeaveApprovals";
import MRManagement from "./MRManagement";

type AdminPage =
  | "dashboard"
  | "mr-management"
  | "leave-approvals"
  | "products"
  | "areas";

const adminNavItems: {
  id: AdminPage;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "mr-management", label: "MR Management", icon: Users },
  { id: "leave-approvals", label: "Leave Approvals", icon: CalendarCheck },
  { id: "products", label: "Products", icon: Package },
  { id: "areas", label: "Areas", icon: MapPin },
];

const pageTitles: Record<AdminPage, string> = {
  dashboard: "Admin Dashboard",
  "mr-management": "MR Management",
  "leave-approvals": "Leave Approvals",
  products: "Product Master",
  areas: "Area Management",
};

export default function AdminLayout() {
  const { identity, clear } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principal.length > 12
      ? `${principal.slice(0, 8)}...${principal.slice(-4)}`
      : principal;

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <AdminDashboard />;
      case "mr-management":
        return <MRManagement />;
      case "leave-approvals":
        return <LeaveApprovals />;
      case "products":
        return <Products />;
      case "areas":
        return <Areas />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
        style={{
          background: "linear-gradient(180deg, #0B2F6B 0%, #06224F 100%)",
        }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xs leading-tight tracking-wide uppercase">
                Admin Portal
              </p>
              <p className="text-white/60 text-xs leading-tight">
                Krishkar Pharma
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest px-2 mb-3">
            Admin Menu
          </p>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-ocid={`admin_nav.${item.id}.link`}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#0E5AA7] text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="flex-shrink-0" size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-white text-xs font-semibold truncate">
                  Administrator
                </p>
                <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  ADMIN
                </span>
              </div>
              <p className="text-white/50 text-xs truncate">{shortPrincipal}</p>
            </div>
          </div>
          <Button
            data-ocid="admin_logout.button"
            variant="ghost"
            size="sm"
            className="w-full text-white/70 hover:text-white hover:bg-white/10 justify-start gap-2 text-xs"
            onClick={clear}
          >
            <LogOut size={14} /> Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#E5EAF2] px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle sidebar"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {pageTitles[currentPage]}
              </h1>
              <p className="text-xs text-gray-400">
                Krishkar Pharmaceuticals · Admin Panel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <Shield size={14} /> Admin Portal
            </span>
            <p className="text-xs text-gray-400 hidden md:block">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E5EAF2] px-6 py-3 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>

      <Toaster />
    </div>
  );
}

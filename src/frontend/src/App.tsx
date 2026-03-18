import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  CalendarOff,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Package,
  Receipt,
  ShoppingBag,
  Stethoscope,
  User,
} from "lucide-react";
import { useState } from "react";
import AccessPendingScreen from "./components/AccessPendingScreen";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserRole } from "./hooks/useUserRole";
import Areas from "./pages/Areas";
import Chemists from "./pages/Chemists";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Expenses from "./pages/Expenses";
import Leaves from "./pages/Leaves";
import MRProfile from "./pages/MRProfile";
import MRWorkingDetails from "./pages/MRWorkingDetails";
import Products from "./pages/Products";
import Samples from "./pages/Samples";
import AdminLayout from "./pages/admin/AdminLayout";
import ASMLayout from "./pages/asm/ASMLayout";
import RSMLayout from "./pages/rsm/RSMLayout";

type Page =
  | "dashboard"
  | "working-details"
  | "profile"
  | "areas"
  | "doctors"
  | "chemists"
  | "products"
  | "expenses"
  | "leaves"
  | "samples";

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "working-details", label: "Working Details", icon: ClipboardList },
  { id: "profile", label: "MR Profile", icon: User },
  { id: "areas", label: "Areas", icon: MapPin },
  { id: "doctors", label: "Doctors", icon: Stethoscope },
  { id: "chemists", label: "Chemists", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Package },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "leaves", label: "Leaves", icon: CalendarOff },
  { id: "samples", label: "Samples", icon: FlaskConical },
];

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  "working-details": "MR Working Details",
  profile: "MR Profile",
  areas: "Area Management",
  doctors: "Doctor Management",
  chemists: "Chemist Management",
  products: "Product Master",
  expenses: "TA & DA Expenses",
  leaves: "Leave Management",
  samples: "Sample Management",
};

function LoginScreen() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0B2F6B 0%, #06224F 100%)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full mx-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src="/assets/generated/krishkar-logo-transparent.dim_200x200.png"
            alt="Krishkar Pharmaceuticals"
            className="w-12 h-12 object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mt-3">
          Krishkar Pharmaceuticals
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-2">MR Reporting System</p>

        <div className="flex gap-2 justify-center mb-6 mt-4 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
            <User size={11} /> MR Login
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
            📊 RSM Login
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-medium">
            🗂 ASM Login
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
            🛡 Admin Login
          </span>
        </div>

        <Button
          data-ocid="login.primary_button"
          className="w-full bg-[#0D5BA6] hover:bg-[#0a4f96] text-white font-semibold py-3 rounded-xl"
          onClick={login}
          disabled={isLoggingIn || isInitializing}
        >
          {isLoggingIn || isInitializing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...
            </>
          ) : (
            "Login to Continue"
          )}
        </Button>
        <p className="text-xs text-gray-400 mt-4">
          Your role (MR, ASM, RSM or Admin) will be detected automatically after
          login.
        </p>
      </div>
    </div>
  );
}

function MRLayout() {
  const { identity, clear } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principal.length > 12
      ? `${principal.slice(0, 8)}...${principal.slice(-4)}`
      : principal;

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            onAddWorkingDetails={() => setCurrentPage("working-details")}
          />
        );
      case "working-details":
        return <MRWorkingDetails />;
      case "profile":
        return <MRProfile />;
      case "areas":
        return <Areas />;
      case "doctors":
        return <Doctors />;
      case "chemists":
        return <Chemists />;
      case "products":
        return <Products />;
      case "expenses":
        return <Expenses />;
      case "leaves":
        return <Leaves />;
      case "samples":
        return <Samples />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-0 overflow-hidden"}`}
        style={{
          background: "linear-gradient(180deg, #0B2F6B 0%, #06224F 100%)",
        }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 p-1">
              <img
                src="/assets/generated/krishkar-logo-transparent.dim_200x200.png"
                alt="Krishkar"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-white font-bold text-xs leading-tight tracking-wide uppercase">
                Krishkar
              </p>
              <p className="text-white/60 text-xs leading-tight">
                Pharmaceuticals
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest px-2 mb-3">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-ocid={`nav.${item.id}.link`}
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

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-white text-xs font-semibold truncate">
                  MR User
                </p>
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  MR
                </span>
              </div>
              <p className="text-white/50 text-xs truncate">{shortPrincipal}</p>
            </div>
          </div>
          <Button
            data-ocid="logout.button"
            variant="ghost"
            size="sm"
            className="w-full text-white/70 hover:text-white hover:bg-white/10 justify-start gap-2 text-xs"
            onClick={clear}
          >
            <LogOut size={14} /> Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
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
                Krishkar Pharmaceuticals · MR Reporting
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">MR Portal</p>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </header>

        {/* Page content */}
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

function RoleRouter() {
  const { role, isLoading } = useUserRole();

  if (isLoading || role === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-gray-500">Detecting your role...</p>
      </div>
    );
  }

  if (role === "admin") return <AdminLayout />;
  if (role === "rsm") return <RSMLayout />;
  if (role === "asm") return <ASMLayout />;
  if (role === "user") return <MRLayout />;

  // guest
  return <AccessPendingScreen />;
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  return <RoleRouter />;
}

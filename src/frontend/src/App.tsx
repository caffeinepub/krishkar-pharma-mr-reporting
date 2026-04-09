import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  CalendarOff,
  ClipboardList,
  Eye,
  EyeOff,
  FlaskConical,
  History,
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
import { toast } from "sonner";
import { createActor } from "./backend"; // used by useActor
import { useGPSUpdater } from "./hooks/useGPSUpdater";
import { useSessionAuth } from "./hooks/useSessionAuth";
import { useUserRole } from "./hooks/useUserRole";
import { getSession } from "./lib/sessionManager";
import Areas from "./pages/Areas";
import Chemists from "./pages/Chemists";
import Dashboard from "./pages/Dashboard";
import DoctorCallHistoryPage from "./pages/DoctorCallHistoryPage";
import Doctors from "./pages/Doctors";
import Expenses from "./pages/Expenses";
import Leaves from "./pages/Leaves";
import MRProfile from "./pages/MRProfile";
import MRWorkingDetails from "./pages/MRWorkingDetails";
import Products from "./pages/Products";
import Samples from "./pages/Samples";
import WorkingPlanPage from "./pages/WorkingPlanPage";
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
  | "samples"
  | "working-plan"
  | "call-history";

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "working-details", label: "Working Details", icon: ClipboardList },
  { id: "call-history", label: "Call History", icon: History },
  { id: "working-plan", label: "Working Plan", icon: MapPin },
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
  "working-plan": "Working Plan",
  "call-history": "Call History - Last 5 Days",
  profile: "MR Profile",
  areas: "Area Management",
  doctors: "Doctor Management",
  chemists: "Chemist Management",
  products: "Product Master",
  expenses: "TA & DA Expenses",
  leaves: "Leave Management",
  samples: "Sample Management",
};

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const { actor } = useActor(createActor);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const session = getSession();

  const handleSubmit = async () => {
    if (!session || !actor) return;
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const result = await actor.changePassword(session.token, oldPw, newPw);
      if (result.__kind__ === "err") {
        toast.error(result.err);
      } else {
        toast.success("Password changed successfully!");
        onDone();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0B2F6B 0%, #06224F 100%)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
        <div className="flex justify-center mb-4">
          <img
            src="/assets/generated/krishkar-logo-transparent.dim_200x200.png"
            alt="Krishkar"
            className="w-14 h-14 object-contain"
          />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
          Change Your Password
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          You must set a new password before continuing
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="old-pw">Current Password</Label>
            <div className="relative mt-1">
              <Input
                id="old-pw"
                type={showOld ? "text" : "password"}
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                placeholder="Current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="new-pw">New Password</Label>
            <div className="relative mt-1">
              <Input
                id="new-pw"
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <Button
            data-ocid="change_password.submit_button"
            className="w-full bg-[#0D5BA6] hover:bg-[#0a4f96] text-white font-semibold"
            onClick={handleSubmit}
            disabled={loading || !oldPw || !newPw || !confirmPw}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              "Set New Password"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { login, isLoading, error, clearError } = useSessionAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    clearError();
    const success = await login(userId, password);
    if (success) onLogin();
  };

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
        <p className="text-sm text-gray-500 mt-1 mb-6">MR Reporting System</p>
        <div className="space-y-4 text-left">
          <div>
            <Label htmlFor="login-userid">User ID</Label>
            <Input
              id="login-userid"
              data-ocid="login.userid.input"
              className="mt-1"
              placeholder="Enter your User ID"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                clearError();
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="login-password">Password</Label>
            <div className="relative mt-1">
              <Input
                id="login-password"
                data-ocid="login.password.input"
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 text-center font-medium">
              {error}
            </p>
          )}
          <Button
            data-ocid="login.primary_button"
            className="w-full bg-[#0D5BA6] hover:bg-[#0a4f96] text-white font-semibold py-3 rounded-xl"
            onClick={handleLogin}
            disabled={isLoading || !userId.trim() || !password}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-5">
          Contact your Admin if you don't have login credentials.
        </p>
      </div>
    </div>
  );
}

function MRLayout({ onLogout }: { onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );
  const session = getSession();
  const userId = session?.userId ?? "";
  useGPSUpdater("MR");

  const handleNav = (page: Page) => {
    setCurrentPage(page);
    if (typeof window !== "undefined" && window.innerWidth < 768)
      setSidebarOpen(false);
  };

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
      case "working-plan":
        return <WorkingPlanPage />;
      case "call-history":
        return <DoctorCallHistoryPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-300 fixed inset-y-0 left-0 z-50 w-64 md:relative md:inset-y-auto md:left-auto md:z-auto ${sidebarOpen ? "translate-x-0 md:w-64" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden"}`}
        style={{
          background: "linear-gradient(180deg, #0B2F6B 0%, #06224F 100%)",
        }}
      >
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
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all ${isActive ? "bg-[#0E5AA7] text-white shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              >
                <Icon className="flex-shrink-0" size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-white text-xs font-semibold truncate">
                  {userId || "MR User"}
                </p>
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  MR
                </span>
              </div>
            </div>
          </div>
          <Button
            data-ocid="logout.button"
            variant="ghost"
            size="sm"
            className="w-full text-white/70 hover:text-white hover:bg-white/10 justify-start gap-2 text-xs"
            onClick={onLogout}
          >
            <LogOut size={14} /> Logout
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-[#E5EAF2] px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
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
              <h1 className="text-base md:text-xl font-bold text-gray-900 truncate max-w-[180px] sm:max-w-none">
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
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {renderPage()}
        </main>
        <footer className="bg-white border-t border-[#E5EAF2] px-4 md:px-6 py-3 flex-shrink-0">
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

function RoleRouter({ onLogout }: { onLogout: () => void }) {
  const { role } = useUserRole();
  if (role === "admin") return <AdminLayout onLogout={onLogout} />;
  if (role === "rsm") return <RSMLayout onLogout={onLogout} />;
  if (role === "asm") return <ASMLayout onLogout={onLogout} />;
  if (role === "user") return <MRLayout onLogout={onLogout} />;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Unknown role. Please contact Admin.
        </p>
        <Button onClick={onLogout}>Logout</Button>
      </div>
    </div>
  );
}

export default function App() {
  const {
    isAuthenticated,
    isLoading,
    mustChangePassword,
    setMustChangePassword,
    logout,
  } = useSessionAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen onLogin={() => window.location.reload()} />
        <Toaster />
      </>
    );
  }

  if (mustChangePassword) {
    return (
      <>
        <ChangePasswordForm onDone={() => setMustChangePassword(false)} />
        <Toaster />
      </>
    );
  }

  return <RoleRouter onLogout={logout} />;
}

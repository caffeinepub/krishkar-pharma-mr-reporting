import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  CalendarCheck,
  CalendarOff,
  CalendarRange,
  ClipboardList,
  History,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Navigation,
  TrendingUp,
  User,
} from "lucide-react";
import { useState } from "react";
import { useGPSUpdater } from "../../hooks/useGPSUpdater";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import Leaves from "../Leaves";
import MRCallDetailsPage from "../MRCallDetailsPage";
import WorkingPlanPage from "../WorkingPlanPage";
import RSMCRMDemand from "./RSMCRMDemand";
import RSMDashboard from "./RSMDashboard";
import RSMGPSTracking from "./RSMGPSTracking";
import RSMLeaveApprovals from "./RSMLeaveApprovals";
import RSMTeamReports from "./RSMTeamReports";
import RSMWorkingDetails from "./RSMWorkingDetails";

type RSMPage =
  | "dashboard"
  | "leave-approvals"
  | "team-reports"
  | "mr-call-details"
  | "crm-demand"
  | "working-details"
  | "working-plan"
  | "my-leaves"
  | "staff-gps";

const navItems: { id: RSMPage; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "working-details", label: "Working Details", icon: ClipboardList },
  { id: "working-plan", label: "Working Plan", icon: CalendarRange },
  { id: "leave-approvals", label: "Leave Approvals", icon: CalendarCheck },
  { id: "team-reports", label: "Team Reports", icon: TrendingUp },
  { id: "mr-call-details", label: "MR Call Details", icon: History },
  { id: "crm-demand", label: "CRM Demand", icon: IndianRupee },
  { id: "my-leaves", label: "My Leaves", icon: CalendarOff },
  { id: "staff-gps", label: "Staff GPS Tracking", icon: Navigation },
];

const pageTitles: Record<RSMPage, string> = {
  dashboard: "RSM Dashboard",
  "working-details": "Daily Working Details",
  "working-plan": "Working Plan",
  "leave-approvals": "Leave Approvals",
  "team-reports": "Team Reports",
  "mr-call-details": "MR Call Details — Last 15 Days",
  "crm-demand": "CRM Demand",
  "my-leaves": "Leave Application",
  "staff-gps": "Staff GPS Tracking",
};

export default function RSMLayout() {
  const { identity, clear } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<RSMPage>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );

  // Silently track GPS location in background
  useGPSUpdater("RSM");

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principal.length > 12
      ? `${principal.slice(0, 8)}...${principal.slice(-4)}`
      : principal;

  const handleNav = (page: RSMPage) => {
    setCurrentPage(page);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <RSMDashboard />;
      case "working-details":
        return <RSMWorkingDetails />;
      case "working-plan":
        return <WorkingPlanPage />;
      case "leave-approvals":
        return <RSMLeaveApprovals />;
      case "team-reports":
        return <RSMTeamReports />;
      case "mr-call-details":
        return <MRCallDetailsPage viewerRole="RSM" />;
      case "crm-demand":
        return <RSMCRMDemand />;
      case "my-leaves":
        return <Leaves />;
      case "staff-gps":
        return <RSMGPSTracking />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
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
        className={`flex flex-col flex-shrink-0 transition-all duration-300 fixed inset-y-0 left-0 z-50 w-64 md:relative md:inset-y-auto md:left-auto md:z-auto ${
          sidebarOpen
            ? "translate-x-0 md:w-64"
            : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden"
        }`}
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
                RSM Portal
              </p>
              <p className="text-white/60 text-xs leading-tight">
                Krishkar Pharma
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest px-2 mb-3">
            RSM Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-ocid={`rsm_nav.${item.id}.link`}
                onClick={() => handleNav(item.id)}
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
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-white text-xs font-semibold truncate">
                  RSM User
                </p>
                <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  RSM
                </span>
              </div>
              <p className="text-white/50 text-xs truncate">{shortPrincipal}</p>
            </div>
          </div>
          <Button
            data-ocid="rsm_logout.button"
            variant="ghost"
            size="sm"
            className="w-full text-white/70 hover:text-white hover:bg-white/10 justify-start gap-2 text-xs"
            onClick={clear}
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
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base md:text-xl font-bold text-gray-900 truncate max-w-[180px] sm:max-w-none">
                {pageTitles[currentPage]}
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                Krishkar Pharmaceuticals · RSM Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              🗂 RSM Portal
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

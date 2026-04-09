import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import { clearSession } from "../lib/sessionManager";

export default function AccessPendingScreen() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  const [adminToken, setAdminToken] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [adminAlreadySetup, setAdminAlreadySetup] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (!actor) return;
    actor
      .isAdminInitialized()
      .then((initialized) => setAdminAlreadySetup(initialized))
      .catch(() => setAdminAlreadySetup(false));
  }, [actor]);

  const handleInitAdmin = async () => {
    if (!actor || !adminToken.trim()) return;
    setIsInitializing(true);
    try {
      await actor._initializeAccessControlWithSecret(adminToken.trim());
      toast.success("Admin role assigned! Reloading...");
      await queryClient.invalidateQueries({ queryKey: ["userRole"] });
      window.location.reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already") || msg.includes("registered")) {
        toast.error(
          "Admin already initialized. Contact your admin for access.",
        );
      } else {
        toast.error("Invalid token. Please check and try again.");
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    window.location.reload();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0B2F6B 0%, #06224F 100%)",
      }}
      data-ocid="access_pending.section"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4 text-center">
        <div className="flex items-center justify-center mb-4">
          <img
            src="/assets/generated/krishkar-logo-transparent.dim_200x200.png"
            alt="Krishkar Pharmaceuticals"
            className="w-16 h-16 object-contain"
          />
        </div>

        <h1 className="text-xl font-bold text-gray-900">
          Krishkar Pharmaceuticals
        </h1>
        <p className="text-sm text-gray-500 mt-1">MR Reporting System</p>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800 font-semibold text-sm">
              Access Pending
            </span>
          </div>
          <p className="text-amber-700 text-sm">
            Your account is awaiting admin approval. Please contact your
            administrator to get access.
          </p>
        </div>

        {/* Admin initialization — only shown when no admin has been set up yet */}
        {adminAlreadySetup === false && (
          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-semibold text-sm">
                Initialize as Admin
              </span>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              If you are the app owner, enter the admin secret token below to
              claim the Admin role.
            </p>
            <Input
              type="password"
              placeholder="Enter admin secret token"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="mb-3 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleInitAdmin()}
              data-ocid="access_pending.input"
            />
            <Button
              className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
              onClick={handleInitAdmin}
              disabled={isInitializing || !adminToken.trim()}
              data-ocid="access_pending.submit_button"
            >
              {isInitializing ? "Initializing..." : "Claim Admin Role"}
            </Button>
          </div>
        )}

        <Button
          data-ocid="access_pending.button"
          className="w-full mt-5 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white font-semibold rounded-xl gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>
    </div>
  );
}

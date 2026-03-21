import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, LogOut, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const RECOVERY_PRINCIPAL =
  "grbwb-eomkl-kudk6-gg5mh-ye5qx-b6cqs-7apa2-lus3n-b5lpa-sqbtx-tqe";

export default function AccessPendingScreen() {
  const { identity, clear } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const principal = identity?.getPrincipal().toString() ?? "Unknown";

  const [adminToken, setAdminToken] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [adminAlreadySetup, setAdminAlreadySetup] = useState<boolean | null>(
    null,
  );
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const isRecoveryPrincipal = principal === RECOVERY_PRINCIPAL;

  // Check if admin is already initialized so we can hide the setup panel for regular users
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

  const handleRestoreAdmin = async () => {
    if (!actor) return;
    setIsRestoring(true);
    setRestoreError(null);
    try {
      await (actor as any).emergencyRestoreAdmin();
      toast.success("Admin access restored! Reloading...");
      await queryClient.invalidateQueries({ queryKey: ["userRole"] });
      window.location.reload();
    } catch (err: any) {
      setRestoreError(
        err?.message ?? "Failed to restore admin access. Please try again.",
      );
      setIsRestoring(false);
    }
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

        {/* Admin Recovery Banner — shown only for the recovery principal */}
        {isRecoveryPrincipal && (
          <div
            data-ocid="admin.recovery.panel"
            className="mt-6 bg-amber-50 border border-amber-300 rounded-xl p-4 text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="text-amber-900 font-bold text-sm">
                Admin Access Recovery
              </span>
            </div>
            <p className="text-amber-800 text-xs mb-3">
              Your account was previously the system Admin. Click below to
              restore your Admin access.
            </p>
            <Button
              data-ocid="admin.recovery.primary_button"
              onClick={handleRestoreAdmin}
              disabled={isRestoring}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Restore Admin Access"
              )}
            </Button>
            {restoreError && (
              <p className="text-red-600 text-xs font-medium mt-2">
                {restoreError}
              </p>
            )}
          </div>
        )}

        {!isRecoveryPrincipal && (
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
        )}

        <div className="mt-5 bg-gray-50 rounded-lg p-3 text-left">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
            Your Principal ID
          </p>
          <code className="text-xs text-gray-600 break-all">{principal}</code>
        </div>

        {/* Admin initialization — only shown when no admin has been set up yet and not recovery principal */}
        {!isRecoveryPrincipal && adminAlreadySetup === false && (
          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-semibold text-sm">
                Initialize as Admin
              </span>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              If you are the app owner, enter the admin secret token below to
              claim the Admin role and unlock full access.
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
          onClick={clear}
        >
          <LogOut className="w-4 h-4" /> Logout
        </Button>

        <p className="text-xs text-gray-400 mt-4">
          Share your Principal ID with your admin for account activation.
        </p>
      </div>
    </div>
  );
}

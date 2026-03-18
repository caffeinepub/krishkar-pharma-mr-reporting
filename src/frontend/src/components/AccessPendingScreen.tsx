import { Button } from "@/components/ui/button";
import { Building2, Clock, LogOut } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AccessPendingScreen() {
  const { identity, clear } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "Unknown";

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
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #0B2F6B 0%, #0D5BA6 100%)",
            }}
          >
            <Building2 className="w-8 h-8 text-white" />
          </div>
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

        <div className="mt-5 bg-gray-50 rounded-lg p-3 text-left">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
            Your Principal ID
          </p>
          <code className="text-xs text-gray-600 break-all">{principal}</code>
        </div>

        <Button
          data-ocid="access_pending.button"
          className="w-full mt-6 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white font-semibold rounded-xl gap-2"
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

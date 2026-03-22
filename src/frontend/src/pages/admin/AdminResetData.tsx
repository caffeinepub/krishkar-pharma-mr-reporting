import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

export default function AdminResetData() {
  const { actor } = useActor();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const CONFIRM_PHRASE = "RESET ALL DATA";

  const handleReset = async () => {
    if (confirmText !== CONFIRM_PHRASE) {
      toast.error(`Type "${CONFIRM_PHRASE}" exactly to confirm.`);
      return;
    }
    setLoading(true);
    try {
      if (!actor) throw new Error("Not connected");
      await (actor as any).adminResetAllReportData();
      toast.success("All report data has been cleared successfully.");
      setDone(true);
      setConfirmText("");
    } catch (_e) {
      toast.error("Failed to reset data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-6">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-destructive">
              Reset All Report Data
            </h2>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6 text-sm text-muted-foreground">
          <p>The following data will be permanently deleted:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>All doctor detailing entries</li>
            <li>All sample distribution records</li>
            <li>All chemist orders</li>
            <li>All expense (TA/DA) entries</li>
            <li>All leave applications</li>
            <li>All CRM demand records</li>
            <li>All gift distribution logs and demand orders</li>
            <li>All working plans</li>
            <li>All sample allotments and demand orders</li>
          </ul>
          <p className="mt-2">
            <strong className="text-foreground">
              User accounts, areas, doctors, products, headquarters, and
              settings will not be affected.
            </strong>
          </p>
        </div>

        {done ? (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm font-medium">
            All report data has been cleared. The app is ready for live use.
          </div>
        ) : (
          <div className="space-y-3">
            <label
              htmlFor="confirm-input"
              className="text-sm font-medium text-foreground"
            >
              Type <span className="font-mono font-bold">{CONFIRM_PHRASE}</span>{" "}
              to confirm:
            </label>
            <input
              id="confirm-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleReset}
              disabled={loading || confirmText !== CONFIRM_PHRASE}
              className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? "Clearing data..." : "Clear All Report Data"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

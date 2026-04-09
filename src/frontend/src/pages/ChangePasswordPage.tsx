import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@caffeineai/core-infrastructure";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { createActor } from "../backend";
import type { SessionAuthState } from "../hooks/useSessionAuth";

interface ChangePasswordPageProps {
  auth: SessionAuthState;
}

export default function ChangePasswordPage({ auth }: ChangePasswordPageProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { actor } = useActor(createActor);

  const validate = (): string | null => {
    if (newPassword.length < 6)
      return "New password must be at least 6 characters.";
    if (newPassword !== confirmPassword) return "New passwords do not match.";
    if (newPassword === currentPassword)
      return "New password must differ from current password.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!auth.sessionToken || !actor) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await actor.changePassword(
        auth.sessionToken,
        currentPassword,
        newPassword,
      );
      if (result.__kind__ === "err") {
        setError(result.err);
        setIsSubmitting(false);
        return;
      }
      setSuccess(true);
      // Brief delay then clear the flag
      setTimeout(() => {
        auth.setMustChangePassword(false);
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0B2F6B 0%, #06224F 100%)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div
          className="px-8 py-6 text-center"
          style={{
            background: "linear-gradient(135deg, #0D5BA6 0%, #0B2F6B 100%)",
          }}
        >
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <KeyRound className="text-white" size={24} />
            </div>
          </div>
          <h1 className="text-white text-xl font-bold">Change Password</h1>
          <p className="text-white/70 text-sm mt-1">
            You must change your password before continuing
          </p>
        </div>

        <div className="px-8 py-7">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <p className="text-green-700 font-semibold">
                Password changed successfully!
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Redirecting to your portal...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-amber-800 text-xs">
                This is your first login. Please set a new password to continue.
              </div>

              {/* Current Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="currentPwd"
                  className="text-sm font-medium text-gray-700"
                >
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPwd"
                    data-ocid="changepwd.current_input"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setError(null);
                    }}
                    className="pr-10 h-11 border-gray-200"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showCurrent ? "Hide" : "Show"}
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="newPwd"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPwd"
                    data-ocid="changepwd.new_input"
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError(null);
                    }}
                    className="pr-10 h-11 border-gray-200"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showNew ? "Hide" : "Show"}
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPwd"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPwd"
                    data-ocid="changepwd.confirm_input"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    className="pr-10 h-11 border-gray-200"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? "Hide" : "Show"}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  data-ocid="changepwd.error_message"
                  className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                data-ocid="changepwd.submit_button"
                className="w-full h-11 font-semibold text-sm rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #0D5BA6 0%, #0B2F6B 100%)",
                }}
                disabled={
                  isSubmitting ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>

              <button
                type="button"
                onClick={auth.logout}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2"
              >
                Logout and sign in with different account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

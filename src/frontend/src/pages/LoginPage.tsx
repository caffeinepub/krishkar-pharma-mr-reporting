import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { SessionAuthState } from "../hooks/useSessionAuth";

interface LoginPageProps {
  auth: SessionAuthState;
}

export default function LoginPage({ auth }: LoginPageProps) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password) return;
    await auth.login(userId, password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0B2F6B 0%, #06224F 100%)",
      }}
    >
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header band */}
        <div
          className="px-8 py-6 text-center"
          style={{
            background: "linear-gradient(135deg, #0D5BA6 0%, #0B2F6B 100%)",
          }}
        >
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg p-2">
              <img
                src="/assets/generated/krishkar-logo-transparent.dim_200x200.png"
                alt="Krishkar Pharmaceuticals"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <h1 className="text-white text-xl font-bold tracking-wide leading-tight">
            Krishkar Pharmaceuticals
          </h1>
          <p className="text-white/70 text-sm mt-1">MR Reporting System</p>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <div className="flex gap-2 justify-center mb-6 flex-wrap">
            {[
              {
                label: "MR",
                color: "bg-blue-50 text-blue-700 border-blue-200",
              },
              {
                label: "ASM",
                color: "bg-purple-50 text-purple-700 border-purple-200",
              },
              {
                label: "RSM",
                color: "bg-green-50 text-green-700 border-green-200",
              },
              {
                label: "Admin",
                color: "bg-amber-50 text-amber-700 border-amber-200",
              },
            ].map(({ label, color }) => (
              <span
                key={label}
                className={`text-xs border px-2.5 py-1 rounded-full font-medium ${color}`}
              >
                {label}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="userId"
                className="text-sm font-medium text-gray-700"
              >
                User ID
              </Label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <Input
                  id="userId"
                  data-ocid="login.userid_input"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your User ID"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    auth.clearError();
                  }}
                  className="pl-9 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={auth.isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <Input
                  id="password"
                  data-ocid="login.password_input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    auth.clearError();
                  }}
                  className="pl-9 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={auth.isLoading}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {auth.error && (
              <div
                data-ocid="login.error_message"
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"
              >
                {auth.error}
              </div>
            )}

            <Button
              type="submit"
              data-ocid="login.submit_button"
              className="w-full h-11 font-semibold text-sm rounded-xl mt-2"
              style={{
                background: "linear-gradient(135deg, #0D5BA6 0%, #0B2F6B 100%)",
              }}
              disabled={auth.isLoading || !userId.trim() || !password}
            >
              {auth.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
            Contact your administrator if you don't have login credentials.
          </p>
        </div>
      </div>

      {/* Admin hint */}
      <p className="absolute bottom-4 text-white/30 text-xs text-center">
        Admin: userId=<span className="font-mono">admin</span> / password=
        <span className="font-mono">Admin@1234</span>
      </p>
    </div>
  );
}

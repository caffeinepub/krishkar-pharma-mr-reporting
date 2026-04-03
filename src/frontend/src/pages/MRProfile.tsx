import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building,
  Copy,
  Loader2,
  Lock,
  MapPin,
  Save,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function MRProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principalId = identity?.getPrincipal().toString() ?? "";

  const { data: profile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const [employeeCode, setEmployeeCode] = useState("");
  const [name, setName] = useState("");

  // Profile already exists — populate read-only fields
  useEffect(() => {
    if (profile) {
      setEmployeeCode(profile.employeeCode);
      setName(profile.name);
    }
  }, [profile]);

  // Auto-generate employee code for brand new users (no profile yet)
  useEffect(() => {
    if (!isLoading && !profile && !employeeCode) {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const rand = Math.floor(1000 + Math.random() * 9000);
      setEmployeeCode(`KP-${yy}${mm}-${rand}`);
    }
  }, [isLoading, profile, employeeCode]);

  // Profile is locked once saved — only Admin can edit
  const isLocked = !!profile;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const hq = profile?.headQuarter ?? "";
      await actor.saveCallerUserProfile({
        employeeCode,
        name,
        headQuarter: hq,
      });
    },
    onSuccess: () => {
      toast.success("Profile saved successfully");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to save profile"),
  });

  const copyPrincipal = () => {
    navigator.clipboard.writeText(principalId);
    toast.success("Principal ID copied to clipboard");
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-20"
        data-ocid="profile.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Principal ID Card */}
      <Card className="bg-blue-50 border border-blue-200 shadow-sm rounded-xl">
        <CardHeader className="border-b border-blue-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-blue-900">
                Your Principal ID
              </CardTitle>
              <p className="text-xs text-blue-500 mt-0.5">
                Share this with your Admin to get role access
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-blue-200 rounded-lg px-3 py-2.5 text-blue-800 font-mono break-all">
              {principalId || "Not available"}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyPrincipal}
              className="flex-shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
              disabled={!principalId}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Card */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                Personal Information
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">
                {isLocked
                  ? "Profile is permanent. Contact Admin to make changes."
                  : "Set your name and employee code once at first login"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Locked notice */}
          {isLocked && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Your name and employee number are permanent and can only be
                changed by an <strong>Admin</strong>.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full Name
            </Label>
            <Input
              id="name"
              data-ocid="profile.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="border-[#E5EAF2]"
              readOnly={isLocked}
              disabled={isLocked}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="empCode"
                className="text-sm font-medium text-gray-700"
              >
                Employee Number
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="empCode"
                  data-ocid="profile.employeecode.input"
                  value={employeeCode}
                  readOnly
                  disabled
                  placeholder="Auto-generating..."
                  className="pl-9 pr-9 border-[#E5EAF2] bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isLocked
                  ? "System-assigned — Admin can update if needed"
                  : "Auto-generated on first save"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hq" className="text-sm font-medium text-gray-700">
                Head Quarter
              </Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-[#E5EAF2] bg-gray-50">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {profile?.headQuarter ? (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs font-medium">
                    {profile.headQuarter}
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    Not yet assigned — contact Admin/RSM
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">Assigned by Admin or RSM</p>
            </div>
          </div>

          {profile && (
            <div className="bg-[#F8FAFC] rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Current Profile
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {profile.name || "No name set"}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono">
                  {profile.employeeCode}
                </Badge>
              </div>
            </div>
          )}

          {/* Only show save button when no profile exists yet */}
          {!isLocked && (
            <Button
              data-ocid="profile.submit_button"
              className="w-full bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !name.trim()}
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

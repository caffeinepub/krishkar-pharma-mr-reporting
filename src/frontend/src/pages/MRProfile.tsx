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
  const [headQuarter, setHeadQuarter] = useState("");

  useEffect(() => {
    if (profile) {
      setEmployeeCode(profile.employeeCode);
      setName(profile.name);
      setHeadQuarter(profile.headQuarter);
    }
  }, [profile]);

  // Auto-generate employee code for new signups
  useEffect(() => {
    if (!isLoading && !profile && !employeeCode) {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const rand = Math.floor(1000 + Math.random() * 9000);
      setEmployeeCode(`KP-${yy}${mm}-${rand}`);
    }
  }, [isLoading, profile, employeeCode]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile({ employeeCode, name, headQuarter });
    },
    onSuccess: () => {
      toast.success("Profile saved successfully");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: () => toast.error("Failed to save profile"),
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

      {/* Profile Edit Card */}
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
                Update your MR profile details
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
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
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="empCode"
                className="text-sm font-medium text-gray-700"
              >
                Employee Code
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
                {profile
                  ? "System-assigned — cannot be changed"
                  : "Auto-generated on first save"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hq" className="text-sm font-medium text-gray-700">
                Head Quarter
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="hq"
                  data-ocid="profile.hq.input"
                  value={headQuarter}
                  onChange={(e) => setHeadQuarter(e.target.value)}
                  placeholder="e.g. New Delhi"
                  className="pl-9 border-[#E5EAF2]"
                />
              </div>
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
                <Badge variant="secondary" className="text-xs">
                  {profile.employeeCode || "No code set"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {profile.headQuarter || "No HQ set"}
                </Badge>
              </div>
            </div>
          )}

          <Button
            data-ocid="profile.submit_button"
            className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white w-full"
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending || !name || !employeeCode || !headQuarter
            }
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Profile
              </>
            )}
          </Button>

          {mutation.isSuccess && (
            <div
              data-ocid="profile.success_state"
              className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg text-center"
            >
              ✓ Profile updated successfully
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

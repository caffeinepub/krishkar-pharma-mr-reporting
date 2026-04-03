import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Principal } from "@icp-sdk/core/principal";
import type { Principal as PrincipalType } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerRole, type UserRole } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

export default function UserManagement() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [principalInput, setPrincipalInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [selectedHQ, setSelectedHQ] = useState<string>("");
  const [selectedManagerPrincipal, setSelectedManagerPrincipal] =
    useState<string>("");
  const [managerAreaIds, setManagerAreaIds] = useState<bigint[]>([]);
  const [editUserModal, setEditUserModal] = useState<{
    principal: string;
    name: string;
    employeeCode: string;
    headQuarter: string;
    isManager: boolean;
    managerRole?: string;
  } | null>(null);

  const { data: mrProfiles, isLoading } = useQuery({
    queryKey: ["admin", "mrProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMRProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: managerProfiles = [], isLoading: loadingManagers } = useQuery({
    queryKey: ["admin", "managerProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllManagerProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allAreas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => (actor ? actor.getAllAreas() : []),
    enabled: !!actor && !isFetching,
  });

  const { data: allHeadquarters = [] } = useQuery({
    queryKey: ["headquarters"],
    queryFn: async () => (actor ? actor.getAllHeadquarters() : []),
    enabled: !!actor && !isFetching,
  });

  const { data: allUserProfiles = [] } = useQuery({
    queryKey: ["admin", "allUserProfiles"],
    queryFn: async () => (actor ? actor.getAllUserProfiles() : []),
    enabled: !!actor && !isFetching,
  });

  const nameMap = new Map(
    allUserProfiles.map(([p, prof]) => [p.toString(), prof.name]),
  );

  const { data: selectedManagerAreas } = useQuery({
    queryKey: ["admin", "managerAreas", selectedManagerPrincipal],
    queryFn: async () => {
      if (!actor || !selectedManagerPrincipal) return null;
      const principal = Principal.fromText(selectedManagerPrincipal);
      return actor.getManagerAreas(principal);
    },
    enabled: !!actor && !isFetching && !!selectedManagerPrincipal,
  });

  const assignManagerAreasMutation = useMutation({
    mutationFn: async ({
      principalStr,
      areaIds,
    }: { principalStr: string; areaIds: bigint[] }) => {
      if (!actor) throw new Error("Not connected");
      const principal = Principal.fromText(principalStr);
      await actor.adminAssignManagerAreas(principal, areaIds);
    },
    onSuccess: () => {
      toast.success("Areas assigned successfully!");
      queryClient.invalidateQueries({
        queryKey: ["admin", "managerAreas", selectedManagerPrincipal],
      });
    },
    onError: (err: Error) =>
      toast.error(`Failed to assign areas: ${err.message}`),
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({
      principalStr,
      role,
      hq,
    }: {
      principalStr: string;
      role: string;
      hq: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const principal = Principal.fromText(principalStr.trim());
      // Preserve existing name and employeeCode across role changes
      const existingName = nameMap.get(principalStr.trim()) ?? "";
      // Look up existing manager profile for employee code preservation
      const existingManagerProfile = managerProfiles.find(
        ([p]: [any, any]) => p.toString() === principalStr.trim(),
      );
      const existingEmpCode =
        (existingManagerProfile?.[1] as any)?.employeeCode ?? "";
      if (role === "rsm" || role === "asm") {
        await actor.assignCallerUserRole(principal, "user" as UserRole);
        await actor.adminSaveManagerProfile(
          principal,
          existingName,
          existingEmpCode,
          hq,
          role === "rsm" ? ManagerRole.RSM : ManagerRole.ASM,
        );
      } else if (role === "user") {
        await actor.assignCallerUserRole(principal, role as UserRole);
        // Set HQ on the MR profile if HQ was selected; preserve existing name/empCode
        if (hq) {
          const existingMR = mrProfiles?.find(
            ([p]: [any, any]) => p.toString() === principalStr.trim(),
          );
          const existingMREmpCode =
            (existingMR?.[1] as any)?.employeeCode ?? "";
          await actor.adminCreateOrUpdateMRProfile(
            principal,
            existingMREmpCode,
            hq,
            [],
          );
        }
      } else {
        await actor.assignCallerUserRole(principal, role as UserRole);
      }
    },
    onSuccess: () => {
      toast.success("Role assigned successfully!");
      setPrincipalInput("");
      setSelectedRole("user");
      setSelectedHQ("");
      queryClient.invalidateQueries({ queryKey: ["admin", "mrProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "managerProfiles"] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to assign role: ${err.message}`);
    },
  });

  const deleteManagerMutation = useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteManagerProfile(target);
    },
    onSuccess: () => {
      toast.success("Manager profile deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin", "managerProfiles"] });
    },
    onError: (err: Error) => toast.error(`Failed to delete: ${err.message}`),
  });

  const editUserMutation = useMutation({
    mutationFn: async (data: {
      principal: string;
      name: string;
      employeeCode: string;
      headQuarter: string;
      isManager: boolean;
      managerRole?: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const principal = Principal.fromText(data.principal);
      // Always update the user profile (name + employeeCode)
      await actor.adminSaveUserProfile(principal, {
        name: data.name,
        employeeCode: data.employeeCode,
        headQuarter: data.headQuarter,
      });
      // If manager, also update manager profile to keep name in sync
      if (data.isManager && data.managerRole) {
        await actor.adminSaveManagerProfile(
          principal,
          data.name,
          data.employeeCode,
          data.headQuarter,
          data.managerRole === "RSM" ? ManagerRole.RSM : ManagerRole.ASM,
        );
      }
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      setEditUserModal(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "allUserProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "managerProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "mrProfiles"] });
    },
    onError: (err: Error) => toast.error(`Failed to update: ${err.message}`),
  });

  const handleAssignRole = () => {
    if (!principalInput.trim()) {
      toast.error("Please enter a Principal ID");
      return;
    }
    try {
      Principal.fromText(principalInput.trim());
    } catch {
      toast.error("Invalid Principal ID format");
      return;
    }
    assignRoleMutation.mutate({
      principalStr: principalInput,
      role: selectedRole,
      hq: selectedHQ,
    });
  };

  const showHQDropdown = ["user", "asm", "rsm"].includes(selectedRole);

  return (
    <div data-ocid="user_management.section">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-500 mt-1">
          Assign roles to users and manage access to the application
        </p>
      </div>

      {/* Role Assignment Panel */}
      <Card className="border border-blue-100 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Assign Role
            </CardTitle>
          </div>
          <CardDescription className="text-sm text-gray-500">
            Enter a user's Principal ID and assign a role to grant or change
            their access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="lg:col-span-2">
              <Label
                htmlFor="principal-input"
                className="text-sm font-medium text-gray-700 mb-1 block"
              >
                Principal ID
              </Label>
              <Input
                id="principal-input"
                data-ocid="user_management.input"
                placeholder="e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                value={principalInput}
                onChange={(e) => setPrincipalInput(e.target.value)}
                className="font-mono text-sm bg-white"
              />
              {principalInput.trim() && nameMap.get(principalInput.trim()) && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  User: {nameMap.get(principalInput.trim())}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Role
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => {
                  setSelectedRole(v);
                  setSelectedHQ("");
                }}
              >
                <SelectTrigger
                  data-ocid="user_management.select"
                  className="bg-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    MR (Medical Representative)
                  </SelectItem>
                  <SelectItem value="asm">ASM (Area Sales Manager)</SelectItem>
                  <SelectItem value="rsm">
                    RSM (Regional Sales Manager)
                  </SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="guest">Guest (revoke access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* HQ Dropdown — shown for MR, ASM, RSM */}
            {showHQDropdown && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">
                  Headquarter
                </Label>
                <Select value={selectedHQ} onValueChange={setSelectedHQ}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select HQ (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {allHeadquarters.map((hq) => (
                      <SelectItem key={hq.id.toString()} value={hq.name}>
                        {hq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button
              data-ocid="user_management.submit_button"
              onClick={handleAssignRole}
              disabled={assignRoleMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {assignRoleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCog className="mr-2 h-4 w-4" />
              )}
              {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Admin
              </p>
              <p className="text-xs text-amber-600">
                Full portal access, assign roles, approve leaves
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                RSM
              </p>
              <p className="text-xs text-green-600">
                Regional Manager — views all team reports, approves ASM &amp; MR
                leaves
              </p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                ASM
              </p>
              <p className="text-xs text-purple-600">
                Area Manager — views MR reports, approves MR leaves
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                MR (user)
              </p>
              <p className="text-xs text-blue-600">
                Access to MR reporting: visits, orders, expenses, leaves
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Guest (revoke)
              </p>
              <p className="text-xs text-gray-500">
                Removes access — user sees the Access Pending screen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Profiles Table */}
      <Card className="border border-[#E5EAF2] shadow-sm mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Manager Profiles (RSM / ASM) (
              {loadingManagers ? "..." : managerProfiles.length})
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-400">
            Users assigned as RSM or ASM. Delete to remove manager access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingManagers ? (
            <div
              className="space-y-2"
              data-ocid="manager_profiles.loading_state"
            >
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 w-full rounded-md bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : managerProfiles.length === 0 ? (
            <div
              className="text-center py-8"
              data-ocid="manager_profiles.empty_state"
            >
              <p className="text-gray-400 text-sm">No RSM/ASM profiles yet.</p>
              <p className="text-gray-300 text-xs mt-1">
                Assign the RSM or ASM role above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="manager_profiles.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>HQ</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managerProfiles.map(
                    ([principal, profile]: [any, any], idx: number) => {
                      const p = principal.toString();
                      const short = `${p.slice(0, 10)}...${p.slice(-6)}`;
                      const isRSM = profile.managerRole === "RSM";
                      return (
                        <TableRow
                          key={p}
                          data-ocid={`manager_profiles.row.${idx + 1}`}
                        >
                          <TableCell className="text-gray-500 text-sm">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                              {short}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                isRSM
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-purple-100 text-purple-700 border-purple-200"
                              }
                            >
                              {profile.managerRole}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm">
                            {profile.name || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 text-xs"
                            >
                              {profile.headQuarter || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                data-ocid={`manager_profiles.edit_button.${idx + 1}`}
                                className="h-7 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => {
                                  const userP = p;
                                  const existingName =
                                    nameMap.get(userP) || profile.name || "";
                                  setEditUserModal({
                                    principal: userP,
                                    name: existingName,
                                    employeeCode: profile.employeeCode || "",
                                    headQuarter: profile.headQuarter || "",
                                    isManager: true,
                                    managerRole:
                                      typeof profile.managerRole === "string"
                                        ? profile.managerRole
                                        : profile.managerRole?.RSM !== undefined
                                          ? "RSM"
                                          : "ASM",
                                  });
                                }}
                              >
                                <Pencil size={13} className="mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                data-ocid={`manager_profiles.delete_button.${idx + 1}`}
                                className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() =>
                                  deleteManagerMutation.mutate(principal)
                                }
                                disabled={deleteManagerMutation.isPending}
                              >
                                <Trash2 size={13} className="mr-1" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registered MR Profiles Table */}
      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Registered MR Profiles (
              {isLoading ? "..." : (mrProfiles?.length ?? 0)})
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-400">
            Users who have completed MR profile setup. Click a Principal ID to
            load into the form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              className="space-y-2"
              data-ocid="user_management.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 w-full rounded-md bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : mrProfiles?.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="user_management.empty_state"
            >
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                No MR profiles registered yet.
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Assign the MR role to a user to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="user_management.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Head Quarter</TableHead>
                    <TableHead>Areas</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrProfiles?.map(([principal, profile], idx) => {
                    const p = principal.toString();
                    const short = `${p.slice(0, 10)}...${p.slice(-6)}`;
                    return (
                      <TableRow
                        key={p}
                        data-ocid={`user_management.row.${idx + 1}`}
                      >
                        <TableCell className="text-gray-500 text-sm">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium text-gray-800">
                          {nameMap.get(p) || "—"}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors font-mono"
                            title="Click to load into form"
                            onClick={() => {
                              setPrincipalInput(p);
                              toast.success(
                                "Principal ID loaded into the form above",
                              );
                            }}
                          >
                            {short}
                          </button>
                        </TableCell>
                        <TableCell className="font-medium text-gray-800">
                          {profile.employeeCode}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 text-xs font-medium"
                          >
                            {profile.headQuarter}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-600 text-sm">
                            {profile.assignedAreas.length} area
                            {profile.assignedAreas.length !== 1 ? "s" : ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => {
                                setEditUserModal({
                                  principal: p,
                                  name: nameMap.get(p) || "",
                                  employeeCode: profile.employeeCode || "",
                                  headQuarter: profile.headQuarter || "",
                                  isManager: false,
                                });
                              }}
                            >
                              <Pencil size={13} className="mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2"
                              onClick={() => {
                                setPrincipalInput(p);
                                toast.info(
                                  "Principal ID loaded into the form above",
                                );
                              }}
                            >
                              Change Role
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Assign Areas to Manager Staff (ASM/RSM) */}
      <Card className="border border-[#E5EAF2] shadow-sm mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">
                Assign Areas to Manager Staff (ASM/RSM)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Select a manager and assign the areas they cover
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manager-select">Select Manager</Label>
              <Select
                value={selectedManagerPrincipal}
                onValueChange={(val) => {
                  setSelectedManagerPrincipal(val);
                  setManagerAreaIds([]);
                }}
              >
                <SelectTrigger
                  id="manager-select"
                  data-ocid="user_management.select"
                  className="mt-1.5"
                >
                  <SelectValue placeholder="Choose a manager..." />
                </SelectTrigger>
                <SelectContent>
                  {(managerProfiles as Array<[any, any]>).map(
                    ([p, profile]) => (
                      <SelectItem key={p.toString()} value={p.toString()}>
                        {profile.name || `${p.toString().slice(0, 12)}...`} (
                        {profile.managerRole === "RSM" ||
                        (profile.managerRole &&
                          profile.managerRole.RSM !== undefined)
                          ? "RSM"
                          : "ASM"}
                        )
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedManagerPrincipal && (
              <>
                <div>
                  <Label>Assign Areas</Label>
                  <ManagerAreaCheckboxes
                    allAreas={allAreas as Array<{ id: bigint; name: string }>}
                    currentAreas={selectedManagerAreas}
                    managerAreaIds={managerAreaIds}
                    setManagerAreaIds={setManagerAreaIds}
                  />
                </div>
                <Button
                  data-ocid="user_management.save_button"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={assignManagerAreasMutation.isPending}
                  onClick={() =>
                    assignManagerAreasMutation.mutate({
                      principalStr: selectedManagerPrincipal,
                      areaIds: managerAreaIds,
                    })
                  }
                >
                  {assignManagerAreasMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Area Assignments
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Profile Dialog */}
      <Dialog
        open={!!editUserModal}
        onOpenChange={(o) => !o && setEditUserModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Full Name
              </Label>
              <Input
                value={editUserModal?.name ?? ""}
                onChange={(e) =>
                  setEditUserModal((prev) =>
                    prev ? { ...prev, name: e.target.value } : null,
                  )
                }
                placeholder="Employee full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Employee Number
              </Label>
              <Input
                value={editUserModal?.employeeCode ?? ""}
                onChange={(e) =>
                  setEditUserModal((prev) =>
                    prev ? { ...prev, employeeCode: e.target.value } : null,
                  )
                }
                placeholder="e.g. KP-2601-1234"
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Head Quarter
              </Label>
              <Input
                value={editUserModal?.headQuarter ?? ""}
                onChange={(e) =>
                  setEditUserModal((prev) =>
                    prev ? { ...prev, headQuarter: e.target.value } : null,
                  )
                }
                placeholder="Head Quarter"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserModal(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                editUserMutation.isPending || !editUserModal?.name.trim()
              }
              onClick={() =>
                editUserModal && editUserMutation.mutate(editUserModal)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editUserMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ManagerAreaCheckboxes({
  allAreas,
  currentAreas,
  managerAreaIds,
  setManagerAreaIds,
}: {
  allAreas: Array<{ id: bigint; name: string }>;
  currentAreas: { areaIds: bigint[] } | null | undefined;
  managerAreaIds: bigint[];
  setManagerAreaIds: React.Dispatch<React.SetStateAction<bigint[]>>;
}) {
  // Initialize from currentAreas if managerAreaIds is empty
  const effectiveIds =
    managerAreaIds.length > 0 ? managerAreaIds : (currentAreas?.areaIds ?? []);

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto border rounded p-2 mt-1">
      {allAreas.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 text-center">
          No areas available
        </p>
      ) : (
        allAreas.map((area) => (
          <label
            key={area.id.toString()}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={effectiveIds.some(
                (id) => id.toString() === area.id.toString(),
              )}
              onChange={(e) => {
                const base =
                  managerAreaIds.length > 0
                    ? managerAreaIds
                    : (currentAreas?.areaIds ?? []);
                const updated = e.target.checked
                  ? [...base, area.id]
                  : base.filter((id) => id.toString() !== area.id.toString());
                setManagerAreaIds(updated);
              }}
            />
            {area.name}
          </label>
        ))
      )}
    </div>
  );
}

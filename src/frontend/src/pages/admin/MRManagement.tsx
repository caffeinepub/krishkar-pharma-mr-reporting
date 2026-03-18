import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserRole } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

interface MRProfileForm {
  principalStr: string;
  employeeCode: string;
  headQuarter: string;
}

const emptyMRForm: MRProfileForm = {
  principalStr: "",
  employeeCode: "",
  headQuarter: "",
};

export default function MRManagement() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [principalInput, setPrincipalInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [addMROpen, setAddMROpen] = useState(false);
  const [addMRForm, setAddMRForm] = useState<MRProfileForm>(emptyMRForm);
  const [editingMR, setEditingMR] = useState<{
    principal: Principal;
    form: MRProfileForm;
  } | null>(null);

  const { data: mrProfiles, isLoading } = useQuery({
    queryKey: ["admin", "mrProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMRProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: pendingUsers = [], isLoading: loadingPending } = useQuery({
    queryKey: ["admin", "pendingUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPendingUsers();
    },
    enabled: !!actor && !isFetching,
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({
      principalStr,
      role,
    }: { principalStr: string; role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      const principal = Principal.fromText(principalStr.trim());
      await actor.assignCallerUserRole(principal, role);
    },
    onSuccess: () => {
      toast.success("Role assigned successfully!");
      setPrincipalInput("");
      setSelectedRole("user");
      queryClient.invalidateQueries({ queryKey: ["admin", "mrProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingUsers"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to assign role: ${err.message}`),
  });

  const addMRProfileMutation = useMutation({
    mutationFn: async (form: MRProfileForm) => {
      if (!actor) throw new Error("Not connected");
      const principal = Principal.fromText(form.principalStr.trim());
      await actor.adminCreateOrUpdateMRProfile(
        principal,
        form.employeeCode,
        form.headQuarter,
        [],
      );
    },
    onSuccess: () => {
      toast.success("MR profile created successfully!");
      setAddMROpen(false);
      setAddMRForm(emptyMRForm);
      queryClient.invalidateQueries({ queryKey: ["admin", "mrProfiles"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to create MR profile: ${err.message}`),
  });

  const updateMRProfileMutation = useMutation({
    mutationFn: async ({
      principal,
      form,
    }: { principal: Principal; form: MRProfileForm }) => {
      if (!actor) throw new Error("Not connected");
      // Get current assigned areas for this MR to preserve them
      const existing = mrProfiles?.find(
        ([p]) => p.toString() === principal.toString(),
      );
      const areas = existing ? existing[1].assignedAreas : [];
      await actor.adminCreateOrUpdateMRProfile(
        principal,
        form.employeeCode,
        form.headQuarter,
        areas,
      );
    },
    onSuccess: () => {
      toast.success("MR profile updated successfully!");
      setEditingMR(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "mrProfiles"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to update MR profile: ${err.message}`),
  });

  const deleteMRMutation = useMutation({
    mutationFn: async (mrPrincipal: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteMRProfile(mrPrincipal);
    },
    onSuccess: () => {
      toast.success("MR profile deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "mrProfiles"] });
    },
    onError: (err: Error) => toast.error(`Failed to delete MR: ${err.message}`),
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
      role: selectedRole as UserRole,
    });
  };

  const handleCopyPrincipal = (p: string) => {
    navigator.clipboard
      .writeText(p)
      .then(() => toast.success("Principal ID copied!"));
  };

  const openEditMR = (
    principal: Principal,
    profile: { employeeCode: string; headQuarter: string },
  ) => {
    setEditingMR({
      principal,
      form: {
        principalStr: principal.toString(),
        employeeCode: profile.employeeCode,
        headQuarter: profile.headQuarter,
      },
    });
  };

  return (
    <div data-ocid="mr_management.section">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">MR Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage access and roles for Medical Representatives
          </p>
        </div>
        <Button
          data-ocid="mr_management.open_modal_button"
          className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
          onClick={() => {
            setAddMROpen(true);
            setAddMRForm(emptyMRForm);
          }}
        >
          <Plus className="w-4 h-4" /> Add MR Profile
        </Button>
      </div>

      {/* Pending Users */}
      {(loadingPending || pendingUsers.length > 0) && (
        <Card className="border border-amber-100 bg-amber-50 mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base font-semibold text-gray-800">
                Pending Users ({loadingPending ? "..." : pendingUsers.length})
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-gray-500">
              These users have logged in but not yet been assigned a role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div
                className="space-y-2"
                data-ocid="pending_users.loading_state"
              >
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-2" data-ocid="pending_users.list">
                {pendingUsers.map((p, idx) => {
                  const pStr = p.toString();
                  const short = `${pStr.slice(0, 12)}...${pStr.slice(-6)}`;
                  return (
                    <div
                      key={pStr}
                      data-ocid={`pending_users.item.${idx + 1}`}
                      className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2 border border-amber-200"
                    >
                      <code className="text-xs text-gray-600 font-mono flex-1">
                        {short}
                      </code>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-ocid={`pending_users.copy_principal.${idx + 1}`}
                          onClick={() => handleCopyPrincipal(pStr)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Copy Principal ID"
                        >
                          <Copy size={13} />
                        </button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`pending_users.button.${idx + 1}`}
                          onClick={() => {
                            setPrincipalInput(pStr);
                            setSelectedRole("user");
                          }}
                          className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          Assign Role
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Role Assignment Panel */}
      <Card className="border border-blue-100 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Assign User Role
            </CardTitle>
          </div>
          <CardDescription className="text-sm text-gray-500">
            Grant access to pending users by entering their Principal ID and
            selecting a role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <Label
                htmlFor="principal-input"
                className="text-sm font-medium text-gray-700 mb-1 block"
              >
                Principal ID
              </Label>
              <Input
                id="principal-input"
                data-ocid="role_assignment.input"
                placeholder="e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                value={principalInput}
                onChange={(e) => setPrincipalInput(e.target.value)}
                className="font-mono text-sm bg-white"
              />
            </div>
            <div className="w-full sm:w-44">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Role
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger
                  data-ocid="role_assignment.select"
                  className="bg-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">MR (user)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="guest">Guest (revoke)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              data-ocid="role_assignment.submit_button"
              onClick={handleAssignRole}
              disabled={assignRoleMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              {assignRoleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
            </Button>
          </div>
          {assignRoleMutation.isSuccess && (
            <p
              data-ocid="role_assignment.success_state"
              className="mt-3 text-sm text-green-700 font-medium"
            >
              ✓ Role assigned successfully.
            </p>
          )}
          {assignRoleMutation.isError && (
            <p
              data-ocid="role_assignment.error_state"
              className="mt-3 text-sm text-red-600"
            >
              Error: {assignRoleMutation.error?.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* MR Profiles Table */}
      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Registered MRs ({isLoading ? "..." : (mrProfiles?.length ?? 0)})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" data-ocid="mr_management.loading_state">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : mrProfiles?.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="mr_management.empty_state"
            >
              <p className="text-gray-400 text-sm">
                No MR profiles registered yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="mr_management.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Head Quarter</TableHead>
                    <TableHead>Assigned Areas</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrProfiles?.map(([principal, profile], idx) => {
                    const p = principal.toString();
                    const short = `${p.slice(0, 10)}...${p.slice(-6)}`;
                    return (
                      <TableRow
                        key={p}
                        data-ocid={`mr_management.row.${idx + 1}`}
                      >
                        <TableCell className="text-gray-500 text-sm">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                              {short}
                            </code>
                            <button
                              type="button"
                              data-ocid={`mr_management.copy_principal.${idx + 1}`}
                              onClick={() => handleCopyPrincipal(p)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Copy full Principal ID"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
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
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              data-ocid={`mr_management.edit_button.${idx + 1}`}
                              onClick={() => openEditMR(principal, profile)}
                              className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Pencil size={14} className="mr-1" /> Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-ocid={`mr_management.delete_button.${idx + 1}`}
                                  className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 size={14} className="mr-1" /> Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent data-ocid="mr_management.dialog">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete MR Profile
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the MR
                                    profile for{" "}
                                    <strong>{profile.employeeCode}</strong>?
                                    This will remove their access and all
                                    profile data. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-ocid="mr_management.cancel_button">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    data-ocid="mr_management.confirm_button"
                                    onClick={() =>
                                      deleteMRMutation.mutate(principal)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete MR
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* Add MR Profile Dialog */}
      <Dialog
        open={addMROpen}
        onOpenChange={(o) => {
          setAddMROpen(o);
          if (!o) setAddMRForm(emptyMRForm);
        }}
      >
        <DialogContent data-ocid="mr_management.modal">
          <DialogHeader>
            <DialogTitle>Add MR Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="mr-principal">Principal ID</Label>
              <Input
                id="mr-principal"
                data-ocid="mr_management.input"
                value={addMRForm.principalStr}
                onChange={(e) =>
                  setAddMRForm((p) => ({ ...p, principalStr: e.target.value }))
                }
                placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                className="font-mono text-sm mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mr-emp-code">Employee Code</Label>
              <Input
                id="mr-emp-code"
                value={addMRForm.employeeCode}
                onChange={(e) =>
                  setAddMRForm((p) => ({ ...p, employeeCode: e.target.value }))
                }
                placeholder="e.g. EMP001"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mr-hq">Headquarter</Label>
              <Input
                id="mr-hq"
                value={addMRForm.headQuarter}
                onChange={(e) =>
                  setAddMRForm((p) => ({ ...p, headQuarter: e.target.value }))
                }
                placeholder="e.g. Mumbai"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="mr_management.cancel_button"
              onClick={() => setAddMROpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="mr_management.submit_button"
              disabled={
                addMRProfileMutation.isPending ||
                !addMRForm.principalStr.trim() ||
                !addMRForm.employeeCode.trim()
              }
              onClick={() => addMRProfileMutation.mutate(addMRForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addMRProfileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {addMRProfileMutation.isPending
                ? "Creating..."
                : "Create MR Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit MR Profile Dialog */}
      <Dialog open={!!editingMR} onOpenChange={(o) => !o && setEditingMR(null)}>
        <DialogContent data-ocid="mr_management.modal">
          <DialogHeader>
            <DialogTitle>Edit MR Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Principal ID</Label>
              <Input
                value={editingMR?.form.principalStr ?? ""}
                disabled
                className="font-mono text-sm mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="edit-mr-emp-code">Employee Code</Label>
              <Input
                id="edit-mr-emp-code"
                data-ocid="mr_management.input"
                value={editingMR?.form.employeeCode ?? ""}
                onChange={(e) =>
                  setEditingMR((prev) =>
                    prev
                      ? {
                          ...prev,
                          form: { ...prev.form, employeeCode: e.target.value },
                        }
                      : null,
                  )
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-mr-hq">Headquarter</Label>
              <Input
                id="edit-mr-hq"
                value={editingMR?.form.headQuarter ?? ""}
                onChange={(e) =>
                  setEditingMR((prev) =>
                    prev
                      ? {
                          ...prev,
                          form: { ...prev.form, headQuarter: e.target.value },
                        }
                      : null,
                  )
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="mr_management.cancel_button"
              onClick={() => setEditingMR(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="mr_management.save_button"
              disabled={updateMRProfileMutation.isPending}
              onClick={() =>
                editingMR &&
                updateMRProfileMutation.mutate({
                  principal: editingMR.principal,
                  form: editingMR.form,
                })
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateMRProfileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {updateMRProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { useActor } from "@caffeineai/core-infrastructure";
import {
  CheckCircle2,
  KeyRound,
  Pencil,
  Plus,
  RotateCcw,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Headquarter,
  type StaffAccountInfo,
  createActor,
} from "../../backend";
import { getSession } from "../../lib/sessionManager";

interface CreateForm {
  userId: string;
  tempPassword: string;
  role: string;
  hq: string;
}

interface EditForm {
  role: string;
  hq: string;
  isActive: boolean;
}

const ROLES = ["MR", "ASM", "RSM", "Admin"];

function getAdminToken(): string {
  return getSession()?.token ?? "";
}

export default function StaffAccountManagement() {
  const { actor } = useActor(createActor);

  const [accounts, setAccounts] = useState<StaffAccountInfo[]>([]);
  const [hqs, setHqs] = useState<Headquarter[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  // Create account dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    userId: "",
    tempPassword: "",
    role: "",
    hq: "",
  });
  const [creating, setCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    userId: string;
    password: string;
  } | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffAccountInfo | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    role: "",
    hq: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffAccountInfo | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Toggle active
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!actor) return;
    void loadAll();
  }, [actor]);

  async function loadAll() {
    if (!actor) return;
    setLoading(true);
    try {
      const [accountsRes, hqsData] = await Promise.all([
        actor.adminGetAllStaffAccounts(getAdminToken()),
        actor.getAllHeadquarters(),
      ]);
      if (accountsRes.__kind__ === "ok") {
        setAccounts(accountsRes.ok);
      } else {
        toast.error(`Failed to load accounts: ${accountsRes.err}`);
      }
      setHqs(hqsData);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!actor) return;
    if (
      !createForm.userId.trim() ||
      !createForm.tempPassword.trim() ||
      !createForm.role ||
      !createForm.hq
    ) {
      toast.error("All fields are required");
      return;
    }
    setCreating(true);
    try {
      const res = await actor.adminCreateStaffAccount(
        getAdminToken(),
        createForm.userId.trim(),
        createForm.tempPassword,
        createForm.role,
        createForm.hq,
      );
      if (res.__kind__ === "ok") {
        toast.success("Account created successfully");
        setCreatedCredentials({
          userId: createForm.userId.trim(),
          password: createForm.tempPassword,
        });
        setCreateForm({ userId: "", tempPassword: "", role: "", hq: "" });
        setCreateOpen(false);
        void loadAll();
      } else {
        toast.error(`Failed: ${res.err}`);
      }
    } catch {
      toast.error("Failed to create account");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(account: StaffAccountInfo) {
    setEditTarget(account);
    setEditForm({
      role: account.role,
      hq: account.hq,
      isActive: account.isActive,
    });
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!actor || !editTarget) return;
    setSaving(true);
    try {
      const res = await actor.adminUpdateStaffAccount(
        getAdminToken(),
        editTarget.userId,
        editForm.role !== editTarget.role ? editForm.role : null,
        editForm.hq !== editTarget.hq ? editForm.hq : null,
        editForm.isActive !== editTarget.isActive ? editForm.isActive : null,
      );
      if (res.__kind__ === "ok") {
        toast.success("Account updated");
        setEditOpen(false);
        void loadAll();
      } else {
        toast.error(`Failed: ${res.err}`);
      }
    } catch {
      toast.error("Failed to update account");
    } finally {
      setSaving(false);
    }
  }

  function openReset(account: StaffAccountInfo) {
    setResetTarget(account);
    setNewPassword("");
    setResetOpen(true);
  }

  async function handleResetPassword() {
    if (!actor || !resetTarget) return;
    if (!newPassword.trim()) {
      toast.error("New password is required");
      return;
    }
    setResetting(true);
    try {
      const res = await actor.adminResetStaffPassword(
        getAdminToken(),
        resetTarget.userId,
        newPassword,
      );
      if (res.__kind__ === "ok") {
        toast.success("Password reset successfully");
        setResetOpen(false);
        void loadAll();
      } else {
        toast.error(`Failed: ${res.err}`);
      }
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setResetting(false);
    }
  }

  async function handleToggleActive(account: StaffAccountInfo) {
    if (!actor) return;
    setTogglingId(account.userId);
    try {
      const res = await actor.adminUpdateStaffAccount(
        getAdminToken(),
        account.userId,
        null,
        null,
        !account.isActive,
      );
      if (res.__kind__ === "ok") {
        toast.success(
          account.isActive ? "Account deactivated" : "Account reactivated",
        );
        void loadAll();
      } else {
        toast.error(`Failed: ${res.err}`);
      }
    } catch {
      toast.error("Failed to toggle account status");
    } finally {
      setTogglingId(null);
    }
  }

  const roleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-700 border-red-200";
      case "rsm":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "asm":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Staff Account Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage username/password accounts for all staff
          </p>
        </div>
        <Button
          data-ocid="staff_accounts.create.trigger_button"
          onClick={() => setCreateOpen(true)}
          className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2 self-start sm:self-auto"
        >
          <Plus size={16} /> Create Account
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-foreground">
                  User ID
                </th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">
                  Role
                </th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">
                  HQ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">
                  Password
                </th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                ["r1", "r2", "r3", "r4"].map((rowKey) => (
                  <tr key={rowKey} className="border-b border-border">
                    {["c1", "c2", "c3", "c4", "c5", "c6", "c7"].map(
                      (colKey) => (
                        <td key={colKey} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ),
                    )}
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UserX size={32} className="text-muted-foreground/50" />
                      <p className="font-medium">No staff accounts yet</p>
                      <p className="text-xs">
                        Click "Create Account" to add the first staff member
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr
                    key={acc.userId}
                    data-ocid={`staff_accounts.row.${acc.userId}`}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                      {acc.userId}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {acc.name || (
                        <span className="text-muted-foreground italic">
                          Not set
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeColor(acc.role)}`}
                      >
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {acc.hq || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {acc.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {acc.mustChangePassword ? (
                        <Badge
                          variant="outline"
                          className="text-amber-700 border-amber-300 bg-amber-50 text-xs"
                        >
                          Must Change
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-emerald-700 border-emerald-300 bg-emerald-50 text-xs"
                        >
                          Set
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end flex-wrap">
                        <Button
                          data-ocid={`staff_accounts.edit.${acc.userId}.button`}
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => openEdit(acc)}
                        >
                          <Pencil size={12} /> Edit
                        </Button>
                        <Button
                          data-ocid={`staff_accounts.reset_password.${acc.userId}.button`}
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => openReset(acc)}
                        >
                          <KeyRound size={12} /> Reset PW
                        </Button>
                        <Button
                          data-ocid={`staff_accounts.toggle_active.${acc.userId}.button`}
                          variant="outline"
                          size="sm"
                          className={`h-7 px-2 text-xs gap-1 ${acc.isActive ? "text-destructive border-destructive/40 hover:bg-destructive/10" : "text-emerald-700 border-emerald-400 hover:bg-emerald-50"}`}
                          onClick={() => handleToggleActive(acc)}
                          disabled={togglingId === acc.userId}
                        >
                          {acc.isActive ? (
                            <>
                              <UserX size={12} /> Deactivate
                            </>
                          ) : (
                            <>
                              <RotateCcw size={12} /> Reactivate
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={18} className="text-primary" />
              Create Staff Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-userid">
                User ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-userid"
                data-ocid="staff_accounts.create.userid_input"
                placeholder="e.g. mr_ravi_2026"
                value={createForm.userId}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, userId: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">
                Temporary Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-password"
                data-ocid="staff_accounts.create.password_input"
                type="text"
                placeholder="Staff must change on first login"
                value={createForm.tempPassword}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, tempPassword: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger data-ocid="staff_accounts.create.role_select">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Headquarter <span className="text-destructive">*</span>
              </Label>
              <Select
                value={createForm.hq}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, hq: v }))}
              >
                <SelectTrigger data-ocid="staff_accounts.create.hq_select">
                  <SelectValue placeholder="Select HQ..." />
                </SelectTrigger>
                <SelectContent>
                  {hqs.map((h) => (
                    <SelectItem key={String(h.id)} value={h.name}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                data-ocid="staff_accounts.create.submit_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Created Credentials Dialog */}
      <Dialog
        open={!!createdCredentials}
        onOpenChange={() => setCreatedCredentials(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={18} /> Account Created!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Share these credentials with the staff member. They must change
              their password on first login.
            </p>
            <div className="bg-muted/60 rounded-lg p-4 space-y-3 border border-border">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  User ID
                </p>
                <p className="font-mono font-bold text-foreground text-base">
                  {createdCredentials?.userId}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                  Temporary Password
                </p>
                <p className="font-mono font-bold text-foreground text-base">
                  {createdCredentials?.password}
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ Save these credentials now. The password won't be shown again.
            </p>
            <Button
              className="w-full"
              onClick={() => setCreatedCredentials(null)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={16} className="text-primary" />
              Edit Account — {editTarget?.userId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger data-ocid="staff_accounts.edit.role_select">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Headquarter</Label>
              <Select
                value={editForm.hq}
                onValueChange={(v) => setEditForm((f) => ({ ...f, hq: v }))}
              >
                <SelectTrigger data-ocid="staff_accounts.edit.hq_select">
                  <SelectValue placeholder="Select HQ..." />
                </SelectTrigger>
                <SelectContent>
                  {hqs.map((h) => (
                    <SelectItem key={String(h.id)} value={h.name}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-4 py-3 border border-border">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  data-ocid="staff_accounts.edit.active_toggle"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm font-medium text-foreground">
                  Account Active
                </span>
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                data-ocid="staff_accounts.edit.save_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound size={16} className="text-primary" />
              Reset Password — {resetTarget?.userId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Set a new temporary password. The staff member must change it on
              their next login.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">
                New Temporary Password{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-password"
                data-ocid="staff_accounts.reset_password.input"
                type="text"
                placeholder="Enter new temporary password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setResetOpen(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                data-ocid="staff_accounts.reset_password.submit_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={handleResetPassword}
                disabled={resetting}
              >
                {resetting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

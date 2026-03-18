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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Headquarter } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

export default function AdminHeadquarters() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [editingHQ, setEditingHQ] = useState<Headquarter | null>(null);
  const [editName, setEditName] = useState("");

  const { data: headquarters = [], isLoading } = useQuery<Headquarter[]>({
    queryKey: ["headquarters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllHeadquarters();
    },
    enabled: !!actor && !isFetching,
  });

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.addHeadquarter(name.trim());
    },
    onSuccess: () => {
      toast.success("Headquarter added successfully!");
      setAddOpen(false);
      setAddName("");
      queryClient.invalidateQueries({ queryKey: ["headquarters"] });
    },
    onError: (err: Error) => toast.error(`Failed to add: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: bigint; name: string }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateHeadquarter(id, name.trim());
    },
    onSuccess: () => {
      toast.success("Headquarter updated successfully!");
      setEditingHQ(null);
      queryClient.invalidateQueries({ queryKey: ["headquarters"] });
    },
    onError: (err: Error) => toast.error(`Failed to update: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteHeadquarter(id);
    },
    onSuccess: () => {
      toast.success("Headquarter deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["headquarters"] });
    },
    onError: (err: Error) => toast.error(`Failed to delete: ${err.message}`),
  });

  const openEdit = (hq: Headquarter) => {
    setEditingHQ(hq);
    setEditName(hq.name);
  };

  return (
    <div data-ocid="admin_headquarters.section">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Headquarters</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage headquarters for area assignment.
          </p>
        </div>
        <Button
          data-ocid="admin_headquarters.open_modal_button"
          className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add Headquarter
        </Button>
      </div>

      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              All Headquarters ({isLoading ? "..." : headquarters.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              className="space-y-2"
              data-ocid="admin_headquarters.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : headquarters.length === 0 ? (
            <div
              className="text-center py-16 border border-dashed border-[#E5EAF2] rounded-xl"
              data-ocid="admin_headquarters.empty_state"
            >
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No headquarters added yet
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Add your first headquarter to enable area creation.
              </p>
            </div>
          ) : (
            <div
              className="overflow-x-auto"
              data-ocid="admin_headquarters.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC]">
                    <TableHead className="text-xs font-semibold text-gray-500 w-12">
                      #
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 w-32">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headquarters.map((hq, idx) => (
                    <TableRow
                      key={hq.id.toString()}
                      data-ocid={`admin_headquarters.item.${idx + 1}`}
                      className="hover:bg-[#F8FAFC]"
                    >
                      <TableCell className="text-xs text-gray-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {hq.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin_headquarters.edit_button.${idx + 1}`}
                            onClick={() => openEdit(hq)}
                            className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Pencil size={13} className="mr-1" /> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                data-ocid={`admin_headquarters.delete_button.${idx + 1}`}
                                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 size={13} className="mr-1" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="admin_headquarters.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Headquarter
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{" "}
                                  <strong>{hq.name}</strong>? Areas assigned to
                                  this HQ may be affected.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="admin_headquarters.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid="admin_headquarters.confirm_button"
                                  onClick={() => deleteMutation.mutate(hq.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setAddName("");
        }}
      >
        <DialogContent data-ocid="admin_headquarters.modal">
          <DialogHeader>
            <DialogTitle>Add Headquarter</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="hq-add-name">Headquarter Name</Label>
            <Input
              id="hq-add-name"
              data-ocid="admin_headquarters.input"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Mumbai, Delhi, Kolkata"
              className="mt-1.5"
              onKeyDown={(e) => {
                if (e.key === "Enter" && addName.trim())
                  addMutation.mutate(addName);
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_headquarters.cancel_button"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_headquarters.submit_button"
              disabled={addMutation.isPending || !addName.trim()}
              onClick={() => addMutation.mutate(addName)}
              className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
            >
              {addMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {addMutation.isPending ? "Adding..." : "Add Headquarter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingHQ} onOpenChange={(o) => !o && setEditingHQ(null)}>
        <DialogContent data-ocid="admin_headquarters.modal">
          <DialogHeader>
            <DialogTitle>Edit Headquarter</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="hq-edit-name">Headquarter Name</Label>
            <Input
              id="hq-edit-name"
              data-ocid="admin_headquarters.input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_headquarters.cancel_button"
              onClick={() => setEditingHQ(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_headquarters.save_button"
              disabled={updateMutation.isPending || !editName.trim()}
              onClick={() =>
                editingHQ &&
                updateMutation.mutate({ id: editingHQ.id, name: editName })
              }
              className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Area, Headquarter } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

export default function AdminAreas() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addHQId, setAddHQId] = useState("");

  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editName, setEditName] = useState("");
  const [editHQId, setEditHQId] = useState("");

  const { data: areas = [], isLoading: loadingAreas } = useQuery<Area[]>({
    queryKey: ["areas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: headquarters = [], isLoading: loadingHQ } = useQuery<
    Headquarter[]
  >({
    queryKey: ["headquarters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllHeadquarters();
    },
    enabled: !!actor && !isFetching,
  });

  const hqMap = new Map(headquarters.map((h) => [h.id.toString(), h.name]));
  const isLoading = loadingAreas || loadingHQ;

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.addArea(addName.trim(), BigInt(addHQId));
    },
    onSuccess: () => {
      toast.success("Area added successfully!");
      setAddOpen(false);
      setAddName("");
      setAddHQId("");
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    },
    onError: () => toast.error("Failed to add area"),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !editingArea) throw new Error("Not connected");
      await (actor as any).updateArea(
        editingArea.id,
        editName.trim(),
        BigInt(editHQId),
      );
    },
    onSuccess: () => {
      toast.success("Area updated successfully!");
      setEditingArea(null);
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    },
    onError: () => toast.error("Failed to update area"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await (actor as any).deleteArea(id);
    },
    onSuccess: () => {
      toast.success("Area deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    },
    onError: () => toast.error("Failed to delete area"),
  });

  const openEdit = (area: Area) => {
    setEditingArea(area);
    setEditName(area.name);
    setEditHQId(area.headquarterId.toString());
  };

  const canAdd = addName.trim() && addHQId;
  const canEdit = editName.trim() && editHQId;

  return (
    <div data-ocid="admin_areas.section">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Area Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage areas and their headquarter assignments.
          </p>
        </div>
        <Button
          data-ocid="admin_areas.open_modal_button"
          className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add Area
        </Button>
      </div>

      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              All Areas ({isLoading ? "..." : areas.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" data-ocid="admin_areas.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : areas.length === 0 ? (
            <div
              className="text-center py-16 border border-dashed border-[#E5EAF2] rounded-xl"
              data-ocid="admin_areas.empty_state"
            >
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No areas added yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Add your first area to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="admin_areas.table">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC]">
                    <TableHead className="text-xs font-semibold text-gray-500 w-12">
                      #
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Area Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Headquarter
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Area ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 w-36">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map((area, idx) => (
                    <TableRow
                      key={area.id.toString()}
                      data-ocid={`admin_areas.item.${idx + 1}`}
                      className="hover:bg-[#F8FAFC]"
                    >
                      <TableCell className="text-xs text-gray-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {area.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {hqMap.get(area.headquarterId.toString()) ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        #{area.id.toString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin_areas.edit_button.${idx + 1}`}
                            onClick={() => openEdit(area)}
                            className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Pencil size={13} className="mr-1" /> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                data-ocid={`admin_areas.delete_button.${idx + 1}`}
                                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 size={13} className="mr-1" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="admin_areas.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Area</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{" "}
                                  <strong>{area.name}</strong>? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="admin_areas.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid="admin_areas.confirm_button"
                                  onClick={() => deleteMutation.mutate(area.id)}
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

      {/* Add Area Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) {
            setAddName("");
            setAddHQId("");
          }
        }}
      >
        <DialogContent data-ocid="admin_areas.modal">
          <DialogHeader>
            <DialogTitle>Add Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="add-hq-select">
                Headquarter <span className="text-red-500">*</span>
              </Label>
              <Select value={addHQId} onValueChange={setAddHQId}>
                <SelectTrigger
                  id="add-hq-select"
                  data-ocid="admin_areas.select"
                  className="mt-1.5"
                >
                  <SelectValue placeholder="Choose a headquarter..." />
                </SelectTrigger>
                <SelectContent>
                  {headquarters.map((hq) => (
                    <SelectItem key={hq.id.toString()} value={hq.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {hq.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-area-name">
                Area Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-area-name"
                data-ocid="admin_areas.input"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Sector 12, North Zone"
                className="mt-1.5"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canAdd) addMutation.mutate();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_areas.cancel_button"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_areas.submit_button"
              disabled={addMutation.isPending || !canAdd}
              onClick={() => addMutation.mutate()}
              className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
            >
              {addMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {addMutation.isPending ? "Adding..." : "Add Area"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Area Dialog */}
      <Dialog
        open={!!editingArea}
        onOpenChange={(o) => !o && setEditingArea(null)}
      >
        <DialogContent data-ocid="admin_areas.modal">
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-hq-select">
                Headquarter <span className="text-red-500">*</span>
              </Label>
              <Select value={editHQId} onValueChange={setEditHQId}>
                <SelectTrigger
                  id="edit-hq-select"
                  data-ocid="admin_areas.select"
                  className="mt-1.5"
                >
                  <SelectValue placeholder="Choose a headquarter..." />
                </SelectTrigger>
                <SelectContent>
                  {headquarters.map((hq) => (
                    <SelectItem key={hq.id.toString()} value={hq.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {hq.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-area-name">
                Area Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-area-name"
                data-ocid="admin_areas.input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_areas.cancel_button"
              onClick={() => setEditingArea(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_areas.save_button"
              disabled={updateMutation.isPending || !canEdit}
              onClick={() => updateMutation.mutate()}
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

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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

export default function AdminGiftArticles() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const enabled = !!actor && !isFetching;

  const [addForm, setAddForm] = useState({ name: "", description: "" });
  const [editDialog, setEditDialog] = useState<{
    id: bigint;
    name: string;
    description: string;
  } | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["gift-articles"],
    queryFn: () => actor!.getAllGiftArticles(),
    enabled,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.addGiftArticle(
        addForm.name.trim(),
        addForm.description.trim(),
      );
    },
    onSuccess: () => {
      toast.success("Gift article added!");
      setAddForm({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["gift-articles"] });
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !editDialog) throw new Error("Not connected");
      await actor.updateGiftArticle(
        editDialog.id,
        editDialog.name.trim(),
        editDialog.description.trim(),
      );
    },
    onSuccess: () => {
      toast.success("Gift article updated!");
      setEditDialog(null);
      queryClient.invalidateQueries({ queryKey: ["gift-articles"] });
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteGiftArticle(id);
    },
    onSuccess: () => {
      toast.success("Gift article deleted!");
      queryClient.invalidateQueries({ queryKey: ["gift-articles"] });
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
          <Gift className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Gift Articles</h2>
          <p className="text-sm text-gray-400">
            Manage the gift article catalog for MR distribution
          </p>
        </div>
      </div>

      {/* Add Form */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Add Gift Article
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Article Name</Label>
              <Input
                placeholder="e.g. Pen Set, Calendar, Diary"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm({ ...addForm, name: e.target.value })
                }
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Brief description..."
                value={addForm.description}
                onChange={(e) =>
                  setAddForm({ ...addForm, description: e.target.value })
                }
                className="border-[#E5EAF2] resize-none"
                rows={2}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              disabled={!addForm.name.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {addMutation.isPending ? "Adding..." : "Add Gift Article"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <CardTitle className="text-base font-semibold text-gray-800">
            All Gift Articles ({isLoading ? "..." : articles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No gift articles added yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((a, idx) => (
                    <TableRow key={a.id.toString()}>
                      <TableCell className="text-gray-500 text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {a.name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {a.description || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() =>
                              setEditDialog({
                                id: a.id,
                                name: a.name,
                                description: a.description,
                              })
                            }
                          >
                            <Pencil size={12} /> Edit
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs gap-1"
                            variant="ghost"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(a.id)}
                          >
                            <Trash2 size={12} /> Delete
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog
        open={!!editDialog}
        onOpenChange={(open) => {
          if (!open) setEditDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gift Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={editDialog?.name ?? ""}
                onChange={(e) =>
                  setEditDialog((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={editDialog?.description ?? ""}
                onChange={(e) =>
                  setEditDialog((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev,
                  )
                }
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!editDialog?.name.trim() || editMutation.isPending}
              onClick={() => editMutation.mutate()}
            >
              {editMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

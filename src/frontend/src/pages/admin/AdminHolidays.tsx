import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

type HolidayId = bigint;
interface Holiday {
  id: HolidayId;
  name: string;
  date: string;
  description: string;
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDayName(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "long" });
}

function isSunday(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getDay() === 0;
}

interface HolidayFormState {
  name: string;
  date: string;
  description: string;
}

const emptyForm: HolidayFormState = { name: "", date: "", description: "" };

export default function AdminHolidays() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<HolidayId | null>(null);
  const [form, setForm] = useState<HolidayFormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<HolidayId | null>(
    null,
  );

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllHolidays();
    },
    enabled: !!actor && !isFetching,
  });

  const sorted = (holidays ?? []).sort((a, b) => a.date.localeCompare(b.date));

  const addMutation = useMutation({
    mutationFn: async (data: HolidayFormState) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).adminAddHoliday(
        data.name,
        data.date,
        data.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday added successfully");
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to add holiday"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: HolidayFormState & { id: HolidayId }) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).adminUpdateHoliday(
        data.id,
        data.name,
        data.date,
        data.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday updated successfully");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to update holiday"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: HolidayId) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).adminDeleteHoliday(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday deleted");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Failed to delete holiday"),
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (holiday: Holiday) => {
    setEditingId(holiday.id);
    setForm({
      name: holiday.name,
      date: holiday.date,
      description: holiday.description,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.date) {
      toast.error("Name and date are required");
      return;
    }
    if (editingId !== null) {
      updateMutation.mutate({ ...form, id: editingId });
    } else {
      addMutation.mutate(form);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Holiday Calendar</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage company holidays visible to all staff
          </p>
        </div>
        <Button
          data-ocid="admin_holidays.open_modal_button"
          className="bg-[#0B2F6B] hover:bg-[#06224F] text-white gap-2"
          onClick={handleOpenAdd}
        >
          <Plus size={16} /> Add Holiday
        </Button>
      </div>

      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays size={16} className="text-orange-500" />
            All Holidays
            <Badge
              variant="outline"
              className="ml-auto text-xs bg-orange-50 text-orange-600 border-orange-200"
            >
              {sorted.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-12 gap-2 text-gray-400"
              data-ocid="admin_holidays.loading_state"
            >
              <Loader2 className="animate-spin" size={20} />
              <span>Loading holidays...</span>
            </div>
          ) : sorted.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-14 text-gray-400"
              data-ocid="admin_holidays.empty_state"
            >
              <CalendarDays size={44} className="mb-3 opacity-20" />
              <p className="font-medium text-gray-500">No holidays added yet</p>
              <p className="text-sm mt-1">
                Click "Add Holiday" to create the first entry.
              </p>
            </div>
          ) : (
            <Table data-ocid="admin_holidays.table">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">
                    #
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Holiday Name
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Day
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Description
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((holiday, idx) => (
                  <TableRow
                    key={String(holiday.id)}
                    data-ocid={`admin_holidays.row.${idx + 1}`}
                    className={isSunday(holiday.date) ? "bg-red-50/30" : ""}
                  >
                    <TableCell className="text-gray-400 text-xs">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-800">
                      {holiday.name}
                      {isSunday(holiday.date) && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px] py-0 bg-red-50 text-red-500 border-red-200"
                        >
                          Sun
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700 font-medium">
                      {formatDate(holiday.date)}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {getDayName(holiday.date)}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm max-w-xs">
                      <p className="line-clamp-2">
                        {holiday.description || (
                          <span className="text-gray-300">—</span>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`admin_holidays.edit_button.${idx + 1}`}
                          className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => handleOpenEdit(holiday)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`admin_holidays.delete_button.${idx + 1}`}
                          className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setDeleteConfirmId(holiday.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-ocid="admin_holidays.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays size={18} className="text-orange-500" />
              {editingId !== null ? "Edit Holiday" : "Add New Holiday"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="holiday-name">Holiday Name *</Label>
              <Input
                id="holiday-name"
                data-ocid="admin_holidays.input"
                placeholder="e.g. Diwali, Republic Day"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="holiday-date">Date *</Label>
              <Input
                id="holiday-date"
                type="date"
                data-ocid="admin_holidays.date_input"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="holiday-desc">Description (optional)</Label>
              <Textarea
                id="holiday-desc"
                data-ocid="admin_holidays.textarea"
                placeholder="Brief description of the holiday..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            {form.date && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <CalendarDays size={14} className="text-orange-400" />
                {formatDate(form.date)} · {getDayName(form.date)}
                {isSunday(form.date) && (
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 bg-red-50 text-red-500 border-red-200"
                  >
                    Sunday
                  </Badge>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_holidays.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_holidays.submit_button"
              className="bg-[#0B2F6B] hover:bg-[#06224F] text-white"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isPending
                ? "Saving..."
                : editingId !== null
                  ? "Update Holiday"
                  : "Add Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm" data-ocid="admin_holidays.modal">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Holiday</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete this holiday? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_holidays.cancel_button"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="admin_holidays.confirm_button"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteConfirmId !== null &&
                deleteMutation.mutate(deleteConfirmId)
              }
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { CalendarPlus, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { WorkingPlan } from "../backend";

type MonthFilter = "current" | "next";

function getMonthRange(filter: MonthFilter): {
  start: string;
  end: string;
  label: string;
} {
  const now = new Date();
  const year =
    filter === "next"
      ? now.getMonth() === 11
        ? now.getFullYear() + 1
        : now.getFullYear()
      : now.getFullYear();
  const month = filter === "next" ? (now.getMonth() + 1) % 12 : now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const label = start.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  return { start: fmt(start), end: fmt(end), label };
}

export default function WorkingPlanPage() {
  const { actor } = useActor();
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("current");
  const [plans, setPlans] = useState<WorkingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const [formDate, setFormDate] = useState("");
  const [formContent, setFormContent] = useState("");

  const { start: minDateInput } = getMonthRange("current");
  const { end: maxDateInput } = getMonthRange("next");

  const { start, end, label } = getMonthRange(monthFilter);

  const fetchPlans = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const data = await actor.getMyWorkingPlans();
      setPlans(data);
    } catch {
      toast.error("Failed to load working plans");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const filteredPlans = plans
    .filter((p) => p.date >= start && p.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));

  const resetForm = () => {
    setFormDate("");
    setFormContent("");
  };

  const handleSubmit = async () => {
    if (!actor) return;
    if (!formDate || !formContent.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await actor.addWorkingPlan({
        date: formDate,
        content: formContent.trim(),
        workingMode: "alone",
        workingWith: undefined,
        stationType: "plan",
      });
      toast.success("Working plan added successfully");
      setDialogOpen(false);
      resetForm();
      await fetchPlans();
    } catch {
      toast.error("Failed to add working plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    setDeletingId(id);
    try {
      await actor.deleteWorkingPlan(id);
      toast.success("Plan deleted");
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("Failed to delete plan");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Working Plan</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Plan your field visits for {label}
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              data-ocid="working_plan.open_modal_button"
              className="gap-2 bg-[#0B2F6B] hover:bg-[#0E5AA7]"
            >
              <Plus size={16} /> Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-ocid="working_plan.dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarPlus size={18} className="text-[#0B2F6B]" />
                Add Working Plan
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="plan-date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="plan-date"
                  data-ocid="working_plan.input"
                  type="date"
                  min={minDateInput}
                  max={maxDateInput}
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Allowed: current month and next month only
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-content">
                  Work Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="plan-content"
                  data-ocid="working_plan.textarea"
                  placeholder="Describe the planned work for this day..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                data-ocid="working_plan.cancel_button"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                data-ocid="working_plan.submit_button"
                className="bg-[#0B2F6B] hover:bg-[#0E5AA7]"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {submitting ? "Saving..." : "Save Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs
        value={monthFilter}
        onValueChange={(v) => setMonthFilter(v as MonthFilter)}
      >
        <TabsList data-ocid="working_plan.tab">
          <TabsTrigger value="current">Current Month</TabsTrigger>
          <TabsTrigger value="next">Next Month</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin size={16} className="text-[#0B2F6B]" />
            Plans for {label}
            <Badge variant="outline" className="ml-auto text-xs">
              {filteredPlans.length} plan{filteredPlans.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div
              data-ocid="working_plan.loading_state"
              className="flex items-center justify-center py-12 text-gray-400 gap-2"
            >
              <Loader2 className="animate-spin" size={20} />
              <span>Loading plans...</span>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div
              data-ocid="working_plan.empty_state"
              className="flex flex-col items-center justify-center py-12 text-gray-400"
            >
              <CalendarPlus size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No plans for {label}</p>
              <p className="text-sm mt-1">
                Click "Add Plan" to schedule your field visits
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Description
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan, idx) => (
                  <TableRow
                    key={String(plan.id)}
                    data-ocid={`working_plan.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(`${plan.date}T00:00:00`).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {plan.content}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        data-ocid={`working_plan.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(plan.id)}
                        disabled={deletingId === plan.id}
                      >
                        {deletingId === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

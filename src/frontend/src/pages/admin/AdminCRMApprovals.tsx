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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, IndianRupee, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

function StatusBadge({ status }: { status: string }) {
  const s = String(status);
  if (s === "Approved")
    return (
      <Badge className="bg-green-100 text-green-700 border border-green-200">
        Approved
      </Badge>
    );
  if (s === "Rejected")
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-200">
        Rejected
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">
      Pending
    </Badge>
  );
}

type ActionType = "Approved" | "Rejected";

export default function AdminCRMApprovals() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const enabled = !!actor && !isFetching;
  const [filter, setFilter] = useState<
    "all" | "Pending" | "Approved" | "Rejected"
  >("all");
  const [dialog, setDialog] = useState<{
    demandId: bigint;
    action: ActionType;
  } | null>(null);
  const [remarks, setRemarks] = useState("");

  const { data: demands = [], isLoading } = useQuery({
    queryKey: ["all-crm-demands"],
    queryFn: () => actor!.getAllCRMDemands(),
    enabled,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !dialog) throw new Error("Not connected");
      await actor.updateCRMDemandStatus(
        dialog.demandId,
        dialog.action as any,
        remarks,
      );
    },
    onSuccess: () => {
      toast.success(`CRM demand ${dialog?.action?.toLowerCase()}!`);
      setDialog(null);
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["all-crm-demands"] });
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const filtered = demands.filter(
    (d) => filter === "all" || String(d.status) === filter,
  );
  const pendingCount = demands.filter(
    (d) => String(d.status) === "Pending",
  ).length;
  const approvedCount = demands.filter(
    (d) => String(d.status) === "Approved",
  ).length;
  const rejectedCount = demands.filter(
    (d) => String(d.status) === "Rejected",
  ).length;
  const totalApprovedAmount = demands
    .filter((d) => String(d.status) === "Approved")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <IndianRupee className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">CRM Approvals</h2>
          <p className="text-sm text-gray-400">
            Approve or reject CRM demands raised by ASM & RSM
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: demands.length, color: "text-gray-700" },
          { label: "Pending", value: pendingCount, color: "text-yellow-700" },
          { label: "Approved", value: approvedCount, color: "text-green-700" },
          { label: "Rejected", value: rejectedCount, color: "text-red-700" },
        ].map((stat) => (
          <Card key={stat.label} className="border border-[#E5EAF2] shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>
                {isLoading ? "..." : stat.value}
              </p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {approvedCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 font-medium">
          Total Approved Amount: ₹{totalApprovedAmount.toLocaleString("en-IN")}
        </div>
      )}

      {/* Table */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800">
              CRM Demands
            </CardTitle>
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
            >
              <TabsList className="h-8 text-xs">
                <TabsTrigger value="all" className="text-xs px-3">
                  All
                </TabsTrigger>
                <TabsTrigger value="Pending" className="text-xs px-3">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="Approved" className="text-xs px-3">
                  Approved
                </TabsTrigger>
                <TabsTrigger value="Rejected" className="text-xs px-3">
                  Rejected
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No demands found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Raised By</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d, idx) => (
                    <TableRow key={d.id.toString()}>
                      <TableCell className="text-gray-500 text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {d.raiserName}
                      </TableCell>
                      <TableCell className="text-sm">{d.doctorName}</TableCell>
                      <TableCell className="font-semibold text-blue-700">
                        ₹{d.amount.toString()}
                      </TableCell>
                      <TableCell className="text-sm">{d.date}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[120px] truncate">
                        {d.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status as string} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {d.adminRemarks || "—"}
                      </TableCell>
                      <TableCell>
                        {String(d.status) === "Pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                              onClick={() => {
                                setDialog({
                                  demandId: d.id,
                                  action: "Approved",
                                });
                                setRemarks("");
                              }}
                            >
                              <CheckCircle2 size={12} /> Approve
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white text-xs gap-1"
                              onClick={() => {
                                setDialog({
                                  demandId: d.id,
                                  action: "Rejected",
                                });
                                setRemarks("");
                              }}
                            >
                              <XCircle size={12} /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remarks Dialog */}
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.action === "Approved" ? "Approve" : "Reject"} CRM Demand
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Admin Remarks (optional)</Label>
            <Input
              placeholder="Enter remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              className={
                dialog?.action === "Approved"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm {dialog?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

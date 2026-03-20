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
import { CheckCircle2, Gift, Loader2, XCircle } from "lucide-react";
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

function truncatePrincipal(p: string) {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}...${p.slice(-4)}`;
}

type ActionType = "Approved" | "Rejected";

export default function AdminGiftOrders() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const enabled = !!actor && !isFetching;
  const [filter, setFilter] = useState<
    "all" | "Pending" | "Approved" | "Rejected"
  >("all");
  const [dialog, setDialog] = useState<{
    orderId: bigint;
    action: ActionType;
  } | null>(null);
  const [remarks, setRemarks] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["all-gift-demand-orders"],
    queryFn: () => actor!.getAllGiftDemandOrders(),
    enabled,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !dialog) throw new Error("Not connected");
      await actor.updateGiftDemandOrderStatus(
        dialog.orderId,
        dialog.action as any,
        remarks,
      );
    },
    onSuccess: () => {
      toast.success(`Gift order ${dialog?.action?.toLowerCase()}!`);
      setDialog(null);
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["all-gift-demand-orders"] });
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const filtered = orders.filter(
    (o) => filter === "all" || String(o.status) === filter,
  );
  const pendingCount = orders.filter(
    (o) => String(o.status) === "Pending",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
          <Gift className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Gift Article Orders
          </h2>
          <p className="text-sm text-gray-400">
            Accept or reject gift demand orders raised by MRs
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            label: "Total Orders",
            value: orders.length,
            color: "text-gray-700",
          },
          { label: "Pending", value: pendingCount, color: "text-yellow-700" },
          {
            label: "Approved",
            value: orders.filter((o) => String(o.status) === "Approved").length,
            color: "text-green-700",
          },
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

      {/* Table */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800">
              Gift Demand Orders
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
              No gift orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>MR Principal</TableHead>
                    <TableHead>Gift Article</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o, idx) => (
                    <TableRow key={o.id.toString()}>
                      <TableCell className="text-gray-500 text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">
                        {truncatePrincipal(o.mrPrincipal.toString())}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {o.giftArticleName}
                      </TableCell>
                      <TableCell className="font-semibold text-purple-700">
                        {o.quantity.toString()}
                      </TableCell>
                      <TableCell className="text-sm">{o.date}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[120px] truncate">
                        {o.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status as string} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {o.adminRemarks || "—"}
                      </TableCell>
                      <TableCell>
                        {String(o.status) === "Pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                              onClick={() => {
                                setDialog({
                                  orderId: o.id,
                                  action: "Approved",
                                });
                                setRemarks("");
                              }}
                            >
                              <CheckCircle2 size={12} /> Accept
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white text-xs gap-1"
                              onClick={() => {
                                setDialog({
                                  orderId: o.id,
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
              {dialog?.action === "Approved" ? "Accept" : "Reject"} Gift Order
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
              Confirm {dialog?.action === "Approved" ? "Accept" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

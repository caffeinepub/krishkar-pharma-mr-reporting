import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CheckCircle2, FlaskConical, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

function truncatePrincipal(p: string) {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}...${p.slice(-5)}`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Approved") {
    return (
      <Badge className="bg-green-100 text-green-700 border border-green-200">
        Approved
      </Badge>
    );
  }
  if (status === "Rejected") {
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-200">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">
      Pending
    </Badge>
  );
}

export default function AdminSampleManagement() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [allotForm, setAllotForm] = useState({
    targetPrincipal: "",
    productId: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allotments, isLoading: loadingAllotments } = useQuery({
    queryKey: ["sample-allotments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSampleAllotments();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: demandOrders, isLoading: loadingDemands } = useQuery({
    queryKey: ["all-demand-orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSampleDemandOrders();
    },
    enabled: !!actor && !isFetching,
  });

  const productMap = new Map(
    (products ?? []).map((p) => [p.id.toString(), p.name]),
  );

  const allotMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@dfinity/principal");
      await actor.adminAllotSamples(
        Principal.fromText(allotForm.targetPrincipal),
        BigInt(allotForm.productId),
        BigInt(allotForm.quantity),
        allotForm.date,
      );
    },
    onSuccess: () => {
      toast.success("Samples allotted successfully!");
      setAllotForm({
        targetPrincipal: "",
        productId: "",
        quantity: "",
        date: new Date().toISOString().split("T")[0],
      });
      queryClient.invalidateQueries({ queryKey: ["sample-allotments"] });
    },
    onError: (err: Error) => toast.error(`Failed to allot: ${err.message}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: { orderId: bigint; status: "Approved" | "Rejected" }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateSampleDemandOrderStatus(orderId, status as any);
    },
    onSuccess: () => {
      toast.success("Order status updated!");
      queryClient.invalidateQueries({ queryKey: ["all-demand-orders"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to update status: ${err.message}`),
  });

  const canAllot =
    allotForm.targetPrincipal.trim() &&
    allotForm.productId &&
    allotForm.quantity &&
    Number(allotForm.quantity) > 0;

  return (
    <div className="space-y-8" data-ocid="admin_samples.section">
      {/* Section A - Allot Samples */}
      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Allot Samples
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="target-principal">Target Principal ID</Label>
              <Input
                id="target-principal"
                data-ocid="admin_samples.input"
                className="mt-1"
                placeholder="Principal ID of MR/Staff"
                value={allotForm.targetPrincipal}
                onChange={(e) =>
                  setAllotForm({
                    ...allotForm,
                    targetPrincipal: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Product</Label>
              <Select
                value={allotForm.productId}
                onValueChange={(v) =>
                  setAllotForm({ ...allotForm, productId: v })
                }
              >
                <SelectTrigger
                  data-ocid="admin_samples.select"
                  className="mt-1"
                >
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {(products ?? []).map((p) => (
                    <SelectItem key={p.id.toString()} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="allot-qty">Quantity</Label>
              <Input
                id="allot-qty"
                type="number"
                min="1"
                className="mt-1"
                placeholder="Enter quantity"
                value={allotForm.quantity}
                onChange={(e) =>
                  setAllotForm({ ...allotForm, quantity: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="allot-date">Date</Label>
              <Input
                id="allot-date"
                type="date"
                className="mt-1"
                value={allotForm.date}
                onChange={(e) =>
                  setAllotForm({ ...allotForm, date: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              data-ocid="admin_samples.submit_button"
              className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
              disabled={!canAllot || allotMutation.isPending || loadingProducts}
              onClick={() => allotMutation.mutate()}
            >
              {allotMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4" />
              )}
              {allotMutation.isPending ? "Allotting..." : "Allot Samples"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section B - All Allotments */}
      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">
            All Allotments (
            {loadingAllotments ? "..." : (allotments?.length ?? 0)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAllotments ? (
            <div className="space-y-2" data-ocid="admin_samples.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : allotments?.length === 0 ? (
            <div
              className="text-center py-10 text-gray-400 text-sm"
              data-ocid="admin_samples.empty_state"
            >
              No allotments found.
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="admin_samples.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Target Principal</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(allotments ?? []).map((a, idx) => (
                    <TableRow
                      key={a.id.toString()}
                      data-ocid={`admin_samples.item.${idx + 1}`}
                    >
                      <TableCell className="text-gray-500 text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-sm">{a.date}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">
                        {truncatePrincipal(a.targetPrincipal.toString())}
                      </TableCell>
                      <TableCell className="text-sm">
                        {productMap.get(a.productId.toString()) ??
                          `Product #${a.productId}`}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-700">
                        {a.quantity.toString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section C - Demand Orders */}
      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">
            Sample Demand Orders (
            {loadingDemands ? "..." : (demandOrders?.length ?? 0)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDemands ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : demandOrders?.length === 0 ? (
            <div
              className="text-center py-10 text-gray-400 text-sm"
              data-ocid="admin_samples.empty_state"
            >
              No demand orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>MR Principal</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(demandOrders ?? []).map((order, idx) => (
                    <TableRow
                      key={order.id.toString()}
                      data-ocid={`admin_samples.item.${idx + 1}`}
                    >
                      <TableCell className="text-gray-500 text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-sm">{order.date}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">
                        {truncatePrincipal(order.mrPrincipal.toString())}
                      </TableCell>
                      <TableCell className="text-sm">
                        {productMap.get(order.productId.toString()) ??
                          `Product #${order.productId}`}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {order.requestedQty.toString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[120px] truncate">
                        {order.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status as string} />
                      </TableCell>
                      <TableCell>
                        {(order.status as string) === "Pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              data-ocid={`admin_samples.confirm_button.${idx + 1}`}
                              className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                              disabled={updateStatusMutation.isPending}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  orderId: order.id,
                                  status: "Approved",
                                })
                              }
                            >
                              <CheckCircle2 size={12} /> Approve
                            </Button>
                            <Button
                              size="sm"
                              data-ocid={`admin_samples.delete_button.${idx + 1}`}
                              className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white text-xs gap-1"
                              disabled={updateStatusMutation.isPending}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  orderId: order.id,
                                  status: "Rejected",
                                })
                              }
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
    </div>
  );
}

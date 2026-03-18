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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Package, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

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

export default function Samples() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [demandForm, setDemandForm] = useState({
    productId: "",
    requestedQty: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ["my-sample-balance"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMySampleBalance();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: demandOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["my-demand-orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMySampleDemandOrders();
    },
    enabled: !!actor && !isFetching,
  });

  const productMap = new Map(
    (products ?? []).map((p) => [p.id.toString(), p.name]),
  );

  const raiseDemandMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.raiseSampleDemandOrder(
        BigInt(demandForm.productId),
        BigInt(demandForm.requestedQty),
        demandForm.date,
        demandForm.notes,
      );
    },
    onSuccess: () => {
      toast.success("Demand order raised successfully!");
      setDemandForm({
        productId: "",
        requestedQty: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["my-demand-orders"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to raise demand order: ${err.message}`),
  });

  const canSubmit =
    demandForm.productId &&
    demandForm.requestedQty &&
    Number(demandForm.requestedQty) > 0 &&
    demandForm.date;

  return (
    <div className="space-y-8" data-ocid="samples.section">
      {/* Section A - Sample Balance */}
      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              My Sample Balance
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBalance ? (
            <div className="space-y-2" data-ocid="samples.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !balance || balance.length === 0 ? (
            <div
              className="text-center py-10 text-gray-400 text-sm"
              data-ocid="samples.empty_state"
            >
              No sample balance found. Contact your Admin for sample allotment.
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="samples.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Total Allotted</TableHead>
                    <TableHead>Distributed</TableHead>
                    <TableHead>Remaining Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balance.map((b, idx) => {
                    const isLow = Number(b.balance) < 5;
                    return (
                      <TableRow
                        key={b.productId.toString()}
                        data-ocid={`samples.item.${idx + 1}`}
                        className={isLow ? "bg-amber-50" : ""}
                      >
                        <TableCell className="font-medium">
                          {b.productName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {b.totalAllotted.toString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {b.totalDistributed.toString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold text-sm ${
                              isLow ? "text-amber-600" : "text-green-700"
                            }`}
                          >
                            {b.balance.toString()}
                            {isLow && (
                              <span className="ml-2 text-xs text-amber-500 font-normal">
                                (Low stock)
                              </span>
                            )}
                          </span>
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

      {/* Section B - Raise Demand Order */}
      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Raise Sample Demand Order
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Product</Label>
              <Select
                value={demandForm.productId}
                onValueChange={(v) =>
                  setDemandForm({ ...demandForm, productId: v })
                }
              >
                <SelectTrigger
                  data-ocid="samples.select"
                  className="mt-1"
                  disabled={loadingProducts}
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
              <Label htmlFor="demand-qty">Requested Quantity</Label>
              <Input
                id="demand-qty"
                data-ocid="samples.input"
                type="number"
                min="1"
                className="mt-1"
                placeholder="Enter quantity"
                value={demandForm.requestedQty}
                onChange={(e) =>
                  setDemandForm({ ...demandForm, requestedQty: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="demand-date">Date</Label>
              <Input
                id="demand-date"
                type="date"
                className="mt-1"
                value={demandForm.date}
                onChange={(e) =>
                  setDemandForm({ ...demandForm, date: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="demand-notes">Notes</Label>
              <Textarea
                id="demand-notes"
                data-ocid="samples.textarea"
                className="mt-1 resize-none"
                rows={2}
                placeholder="Optional notes / reason"
                value={demandForm.notes}
                onChange={(e) =>
                  setDemandForm({ ...demandForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              data-ocid="samples.submit_button"
              className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
              disabled={!canSubmit || raiseDemandMutation.isPending}
              onClick={() => raiseDemandMutation.mutate()}
            >
              {raiseDemandMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4" />
              )}
              {raiseDemandMutation.isPending
                ? "Submitting..."
                : "Raise Demand Order"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section C - My Demand Orders */}
      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">
            My Demand Orders (
            {loadingOrders ? "..." : (demandOrders?.length ?? 0)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !demandOrders || demandOrders.length === 0 ? (
            <div
              className="text-center py-10 text-gray-400 text-sm"
              data-ocid="samples.empty_state"
            >
              No demand orders raised yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Requested Qty</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demandOrders.map((order, idx) => (
                    <TableRow
                      key={order.id.toString()}
                      data-ocid={`samples.item.${idx + 1}`}
                    >
                      <TableCell className="text-gray-500 text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-sm">{order.date}</TableCell>
                      <TableCell className="text-sm">
                        {productMap.get(order.productId.toString()) ??
                          `Product #${order.productId}`}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {order.requestedQty.toString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[150px] truncate">
                        {order.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status as string} />
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

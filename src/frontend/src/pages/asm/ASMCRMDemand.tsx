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
import { IndianRupee, Loader2, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

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

export default function ASMCRMDemand() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    doctorId: "",
    amount: "",
    notes: "",
    date: today,
  });

  const enabled = !!actor && !isFetching;

  const { data: allDoctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: () => actor!.getAllDoctors(),
    enabled,
  });

  const { data: myDemands = [], isLoading: loadingDemands } = useQuery({
    queryKey: ["my-crm-demands"],
    queryFn: () => actor!.getMyCRMDemands(),
    enabled,
  });

  const { data: profile } = useQuery({
    queryKey: ["caller-profile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled,
  });

  const { data: managerAreas } = useQuery({
    queryKey: ["manager-areas"],
    queryFn: async () => {
      if (!actor || !identity) return { areaIds: [] };
      return actor.getManagerAreas(identity.getPrincipal());
    },
    enabled: enabled && !!identity,
  });

  const assignedAreaIds = useMemo(
    () => new Set((managerAreas?.areaIds ?? []).map((id) => String(id))),
    [managerAreas],
  );

  const doctors = useMemo(
    () =>
      assignedAreaIds.size > 0
        ? allDoctors.filter((d) => assignedAreaIds.has(String(d.areaId)))
        : allDoctors,
    [allDoctors, assignedAreaIds],
  );

  const raiseMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const doctor = doctors.find((d) => String(d.id) === form.doctorId);
      if (!doctor) throw new Error("Doctor not found");
      const raiserName = profile?.name ?? "ASM";
      await actor.raiseCRMDemand(
        BigInt(form.doctorId),
        doctor.name,
        BigInt(form.amount),
        form.notes,
        form.date,
        raiserName,
      );
    },
    onSuccess: () => {
      toast.success("CRM demand raised successfully!");
      setForm({ doctorId: "", amount: "", notes: "", date: today });
      queryClient.invalidateQueries({ queryKey: ["my-crm-demands"] });
    },
    onError: (err: Error) => toast.error(`Failed: ${err.message}`),
  });

  const canSubmit = form.doctorId && form.amount && Number(form.amount) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <IndianRupee className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">CRM Demand</h2>
          <p className="text-sm text-gray-400">
            Raise doctor-wise CRM amount demands for approval
          </p>
        </div>
      </div>

      {/* Raise Demand Form */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              Raise CRM Demand
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Select Doctor</Label>
              <Select
                value={form.doctorId}
                onValueChange={(v) => setForm({ ...form, doctorId: v })}
              >
                <SelectTrigger className="border-[#E5EAF2]">
                  <SelectValue placeholder="Select doctor..." />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={String(d.id)} value={String(d.id)}>
                      {d.name} — {d.station}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>CRM Amount (₹)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount in Rupees"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Purpose or remarks..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="border-[#E5EAF2] resize-none"
                rows={2}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
              disabled={!canSubmit || raiseMutation.isPending || loadingDoctors}
              onClick={() => raiseMutation.mutate()}
            >
              {raiseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IndianRupee className="h-4 w-4" />
              )}
              {raiseMutation.isPending ? "Submitting..." : "Submit CRM Demand"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Demands Table */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <CardTitle className="text-base font-semibold text-gray-800">
            My CRM Demands ({loadingDemands ? "..." : myDemands.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingDemands ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : myDemands.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No CRM demands raised yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myDemands.map((d, idx) => (
                    <TableRow key={d.id.toString()}>
                      <TableCell className="text-gray-500 text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {d.doctorName}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-700">
                        ₹{d.amount.toString()}
                      </TableCell>
                      <TableCell className="text-sm">{d.date}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[150px] truncate">
                        {d.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status as string} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {d.adminRemarks || "—"}
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

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CalendarOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LeaveType } from "../backend";
import type { LeaveEntry } from "../backend";
import { useActor } from "../hooks/useActor";

async function captureGPSForLeave(): Promise<{
  lat: number;
  lng: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator?.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 10000, maximumAge: 60000 },
    );
  });
}

const LeaveStatus = {
  Pending: "Pending" as const,
  Approved: "Approved" as const,
  Rejected: "Rejected" as const,
};
type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus];

const LEAVE_LABELS: Record<LeaveType, string> = {
  [LeaveType.CasualLeave]: "Casual Leave",
  [LeaveType.SickLeave]: "Sick Leave",
  [LeaveType.EarnedLeave]: "Earned Leave",
  [LeaveType.PrivilegeLeave]: "Privilege Leave",
  [LeaveType.WithoutPayLeave]: "Without Pay Leave",
};

const LEAVE_ALLOCATIONS: Record<LeaveType, number> = {
  [LeaveType.CasualLeave]: 7,
  [LeaveType.SickLeave]: 7,
  [LeaveType.EarnedLeave]: 10,
  [LeaveType.PrivilegeLeave]: 6,
  [LeaveType.WithoutPayLeave]: 0,
};

const BALANCE_LEAVE_TYPES: LeaveType[] = [
  LeaveType.CasualLeave,
  LeaveType.SickLeave,
  LeaveType.EarnedLeave,
  LeaveType.PrivilegeLeave,
];

function statusBadge(status: LeaveStatus) {
  const map: Record<string, string> = {
    [LeaveStatus.Pending]: "bg-yellow-50 text-yellow-700 border-yellow-200",
    [LeaveStatus.Approved]: "bg-green-50 text-green-700 border-green-200",
    [LeaveStatus.Rejected]: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status]}`}>
      {status}
    </Badge>
  );
}

export default function Leaves() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.CasualLeave);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const days =
    fromDate && toDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(toDate).getTime() - new Date(fromDate).getTime()) /
              86400000,
          ) + 1,
        )
      : 0;

  const { data: history = [], isLoading } = useQuery<LeaveEntry[]>({
    queryKey: ["leaves"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaveHistory();
    },
    enabled: !!actor && !isFetching,
  });

  const leaveUsed: Partial<Record<LeaveType, number>> = {};
  for (const entry of history) {
    if (entry.status === LeaveStatus.Approved) {
      const lt = entry.leaveType;
      leaveUsed[lt] = (leaveUsed[lt] ?? 0) + Number(entry.days);
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const gps = await captureGPSForLeave();
      const lat: [] | [number] = gps ? [gps.lat] : [];
      const lng: [] | [number] = gps ? [gps.lng] : [];
      await actor.applyLeave(
        leaveType,
        fromDate,
        toDate,
        BigInt(days),
        reason,
        lat,
        lng,
      );
    },
    onSuccess: () => {
      toast.success("Leave applied successfully");
      setFromDate("");
      setToDate("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: () => toast.error("Failed to apply leave"),
  });

  return (
    <div className="space-y-6">
      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {BALANCE_LEAVE_TYPES.map((lt) => {
          const alloc = LEAVE_ALLOCATIONS[lt];
          const used = leaveUsed[lt] ?? 0;
          const balance = alloc - used;
          return (
            <Card
              key={lt}
              className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl"
            >
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium text-gray-500">
                  {LEAVE_LABELS[lt]}
                </p>
                <p className="text-2xl font-bold text-[#0D5BA6] mt-1">
                  {balance}
                </p>
                <p className="text-xs text-gray-400">of {alloc} days</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Apply Leave Form */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <CalendarOff className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                Apply for Leave
              </CardTitle>
              <p className="text-xs text-gray-400">
                Submit your leave application
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                Leave Type
              </Label>
              <Select
                value={leaveType}
                onValueChange={(v) => setLeaveType(v as LeaveType)}
              >
                <SelectTrigger
                  data-ocid="leaves.type.select"
                  className="border-[#E5EAF2]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LeaveType).map((lt) => (
                    <SelectItem key={lt} value={lt}>
                      {LEAVE_LABELS[lt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                From Date
              </Label>
              <Input
                type="date"
                data-ocid="leaves.from.input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                To Date
              </Label>
              <Input
                type="date"
                data-ocid="leaves.to.input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Days</Label>
              <div className="h-10 px-3 rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] flex items-center">
                <CalendarDays className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm font-semibold text-gray-700">
                  {days} day{days !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Reason</Label>
            <Input
              data-ocid="leaves.reason.input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief reason for leave..."
              className="border-[#E5EAF2]"
            />
          </div>
          <Button
            data-ocid="leaves.submit_button"
            className="mt-5 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              !fromDate ||
              !toDate ||
              !reason ||
              days === 0
            }
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Leave Application"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Leave History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex justify-center py-12"
              data-ocid="leaves.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div data-ocid="leaves.empty_state" className="text-center py-12">
              <CalendarOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No leave applications yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC]">
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Leave Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      From
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      To
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Days
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Reason
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, idx) => (
                    <TableRow
                      key={`${entry.fromDate}-${entry.leaveType}-${idx}`}
                      data-ocid={`leaves.item.${idx + 1}`}
                      className="hover:bg-[#F8FAFC]"
                    >
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {LEAVE_LABELS[entry.leaveType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {entry.fromDate}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {entry.toDate}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-700">
                        {String(entry.days)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                        {entry.reason}
                      </TableCell>
                      <TableCell>{statusBadge(entry.status)}</TableCell>
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

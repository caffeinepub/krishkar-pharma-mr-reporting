import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

const LeaveStatus = {
  Pending: "Pending" as const,
  Approved: "Approved" as const,
  Rejected: "Rejected" as const,
};
type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus];

export default function RSMLeaveApprovals() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const { data: teamLeaves = [], isLoading } = useQuery({
    queryKey: ["rsm", "teamLeaves"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getTeamLeaveApplications();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allUserProfiles = [] } = useQuery({
    queryKey: ["rsm", "allUserProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({
      principal,
      index,
      status,
    }: { principal: any; index: number; status: LeaveStatus }) => {
      if (!actor) throw new Error("No actor");
      await (actor as any).updateLeaveStatusByManager(
        principal,
        BigInt(index),
        status,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsm", "teamLeaves"] });
      toast.success("Leave status updated successfully");
    },
    onError: () => toast.error("Failed to update leave status"),
  });

  const profileMap = new Map(
    (allUserProfiles as Array<[any, any]>).map(([p, profile]) => [
      p.toString(),
      profile.name as string,
    ]),
  );

  const allLeaves = (teamLeaves as Array<[any, any[]]>).flatMap(
    ([principal, entries]) =>
      entries.map((entry, idx) => ({ principal, entry, idx })),
  );

  const statusBadge = (status: string) => {
    if (status === "Approved")
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          Approved
        </Badge>
      );
    if (status === "Rejected")
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          Rejected
        </Badge>
      );
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        Pending
      </Badge>
    );
  };

  return (
    <div data-ocid="rsm_leave_approvals.section">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Leave Approvals</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve leave requests from your team
        </p>
      </div>

      {isLoading ? (
        <div
          className="space-y-3"
          data-ocid="rsm_leave_approvals.loading_state"
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : allLeaves.length === 0 ? (
        <div
          className="text-center py-20 border border-dashed border-gray-200 rounded-xl"
          data-ocid="rsm_leave_approvals.empty_state"
        >
          <p className="text-gray-400 text-sm">No leave applications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allLeaves.map(({ principal, entry, idx }, listIdx) => {
            const pStr = principal.toString();
            const name =
              profileMap.get(pStr) ||
              `${pStr.slice(0, 10)}...${pStr.slice(-6)}`;
            return (
              <Card
                key={`${pStr}-${idx}`}
                className="border border-[#E5EAF2] shadow-sm"
                data-ocid={`rsm_leave_approvals.item.${listIdx + 1}`}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {entry.leaveType}
                        </span>
                        {statusBadge(entry.status)}
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {Number(entry.days)} day
                          {Number(entry.days) !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">By:</span> {name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-medium">Period:</span>{" "}
                        {entry.fromDate} → {entry.toDate}
                      </p>
                      {entry.reason && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-medium">Reason:</span>{" "}
                          {entry.reason}
                        </p>
                      )}
                    </div>
                    {entry.status === "Pending" && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          data-ocid={`rsm_leave_approvals.confirm_button.${listIdx + 1}`}
                          onClick={() =>
                            updateStatus({
                              principal,
                              index: idx,
                              status: LeaveStatus.Approved,
                            })
                          }
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          data-ocid={`rsm_leave_approvals.delete_button.${listIdx + 1}`}
                          onClick={() =>
                            updateStatus({
                              principal,
                              index: idx,
                              status: LeaveStatus.Rejected,
                            })
                          }
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

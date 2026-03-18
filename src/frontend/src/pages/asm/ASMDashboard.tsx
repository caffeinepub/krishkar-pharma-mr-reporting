import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, DollarSign, Users, X } from "lucide-react";
import { toast } from "sonner";
import { LeaveStatus } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

export default function ASMDashboard() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const { data: teamLeaves = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ["asm", "teamLeaves"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getTeamLeaveApplications();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: teamDetailing = [], isLoading: loadingDetailing } = useQuery({
    queryKey: ["asm", "teamDetailing"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getTeamDetailingEntries();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: teamExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["asm", "teamExpenses"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getTeamExpenseEntries();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allUserProfiles = [] } = useQuery({
    queryKey: ["asm", "allUserProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const { mutate: updateLeaveStatus } = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["asm", "teamLeaves"] });
      toast.success("Leave status updated");
    },
    onError: () => toast.error("Failed to update leave status"),
  });

  const profileMap = new Map(
    (allUserProfiles as Array<[any, any]>).map(([p, profile]) => [
      p.toString(),
      profile.name as string,
    ]),
  );

  const getUserName = (principalStr: string) => {
    const name = profileMap.get(principalStr);
    if (name) return name;
    return `${principalStr.slice(0, 8)}...`;
  };

  const totalMembers = (teamDetailing as Array<[any, any[]]>).length;
  const totalVisits = (teamDetailing as Array<[any, any[]]>).reduce(
    (sum, [, entries]) => sum + entries.length,
    0,
  );
  const totalExpense = (teamExpenses as Array<[any, any[]]>).reduce(
    (sum, [, entries]) =>
      sum +
      entries.reduce(
        (s: number, e: any) => s + Number(e.taAmount) + Number(e.daAmount),
        0,
      ),
    0,
  );

  const allLeaves = (teamLeaves as Array<[any, any[]]>).flatMap(
    ([principal, entries]) =>
      entries.map((entry, idx) => ({ principal, entry, idx })),
  );
  const pendingLeaves = allLeaves.filter((l) => l.entry.status === "Pending");

  const isLoading = loadingLeaves || loadingDetailing || loadingExpenses;

  return (
    <div data-ocid="asm_dashboard.section">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">ASM Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Area overview — team performance and leave requests
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border border-[#E5EAF2] shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Team Members
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {totalMembers}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#E5EAF2] shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Detailing Visits
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {totalVisits}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#E5EAF2] shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Expenses
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    ₹{totalExpense.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Leave Approvals */}
      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">
            Pending Leave Requests (
            {loadingLeaves ? "..." : pendingLeaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLeaves ? (
            <div className="space-y-3" data-ocid="asm_dashboard.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : pendingLeaves.length === 0 ? (
            <div
              className="text-center py-10"
              data-ocid="asm_dashboard.empty_state"
            >
              <p className="text-gray-400 text-sm">
                No pending leave requests.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map(({ principal, entry, idx }, listIdx) => {
                const pStr = principal.toString();
                return (
                  <div
                    key={`${pStr}-${idx}`}
                    data-ocid={`asm_dashboard.item.${listIdx + 1}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-[#E5EAF2] bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {entry.leaveType}
                        </span>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          Pending
                        </Badge>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {Number(entry.days)} day
                          {Number(entry.days) !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">By:</span>{" "}
                        {getUserName(pStr)}
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        data-ocid={`asm_dashboard.confirm_button.${listIdx + 1}`}
                        onClick={() =>
                          updateLeaveStatus({
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
                        data-ocid={`asm_dashboard.delete_button.${listIdx + 1}`}
                        onClick={() =>
                          updateLeaveStatus({
                            principal,
                            index: idx,
                            status: LeaveStatus.Rejected,
                          })
                        }
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

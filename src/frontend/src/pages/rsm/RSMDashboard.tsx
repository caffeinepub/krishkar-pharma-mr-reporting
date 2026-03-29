import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ClipboardList,
  DollarSign,
  MapPin,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import HolidayCalendarWidget from "../../components/HolidayCalendarWidget";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

const LeaveStatus = {
  Pending: "Pending" as const,
  Approved: "Approved" as const,
  Rejected: "Rejected" as const,
};
type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus];

export default function RSMDashboard() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const { data: teamLeaves = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ["rsm", "teamLeaves"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getTeamLeaveApplications();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: teamDetailing = [], isLoading: loadingDetailing } = useQuery({
    queryKey: ["rsm", "teamDetailing"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getTeamDetailingEntries();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: teamExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["rsm", "teamExpenses"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getTeamExpenseEntries();
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

  const { data: allManagerProfiles = [] } = useQuery({
    queryKey: ["rsm", "allManagerProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllManagerProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allAreas = [] } = useQuery({
    queryKey: ["rsm", "allAreas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: managerAreas } = useQuery({
    queryKey: ["rsm", "managerAreas"],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getManagerAreas(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
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
      queryClient.invalidateQueries({ queryKey: ["rsm", "teamLeaves"] });
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

  const managerProfileSet = new Set(
    (allManagerProfiles as Array<[any, any]>).map(([p]) => p.toString()),
  );

  // Combined map for getUserName (includes both MRs and managers)
  const managerProfileMap = new Map(
    (allManagerProfiles as Array<[any, any]>).map(([p, profile]) => [
      p.toString(),
      profile.name as string,
    ]),
  );

  const getUserName = (principalStr: string) => {
    const name =
      profileMap.get(principalStr) ?? managerProfileMap.get(principalStr);
    if (name) return name;
    return `${principalStr.slice(0, 8)}...`;
  };

  const areaMap = new Map(
    (allAreas as Array<{ id: bigint; name: string }>).map((a) => [
      a.id.toString(),
      a.name,
    ]),
  );

  const assignedAreaNames: string[] = (managerAreas?.areaIds ?? []).map(
    (id: bigint) => areaMap.get(id.toString()) ?? `Area #${id}`,
  );

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

  // Build chart data helper
  const buildChartData = (entries: Array<[any, any[]]>) =>
    entries.map(([principal, expList]) => {
      const name = getUserName(principal.toString());
      const doctorsVisited = expList.reduce((sum: number, e: any) => {
        const match = (e.notes || "").match(/Doctors Visited: (\d+)/);
        return sum + (match ? Number.parseInt(match[1]) : 0);
      }, 0);
      const totalKm = expList.reduce(
        (sum: number, e: any) => sum + Number(e.kmTraveled) / 10,
        0,
      );
      const totalTA = expList.reduce(
        (sum: number, e: any) => sum + Number(e.taAmount) / 100,
        0,
      );
      const totalDA = expList.reduce(
        (sum: number, e: any) => sum + Number(e.daAmount),
        0,
      );
      return {
        name,
        doctorsVisited,
        totalKm: Number(totalKm.toFixed(1)),
        totalTA: Number(totalTA.toFixed(2)),
        totalDA,
      };
    });

  // Split team expenses into MR vs ASM
  const mrExpenses = (teamExpenses as Array<[any, any[]]>).filter(
    ([principal]) => !managerProfileSet.has(principal.toString()),
  );
  const asmExpenses = (teamExpenses as Array<[any, any[]]>).filter(
    ([principal]) => managerProfileSet.has(principal.toString()),
  );

  const mrChartData = buildChartData(mrExpenses);
  const asmChartData = buildChartData(asmExpenses);

  const renderCharts = (
    data: ReturnType<typeof buildChartData>,
    doctorColor: string,
    kmColor: string,
    label: string,
  ) => {
    if (data.length === 0) {
      return (
        <p className="text-sm text-gray-400 text-center py-8">
          No {label} working data available yet.
        </p>
      );
    }
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Doctors Visited per {label}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="doctorsVisited"
                  name="Doctors Visited"
                  fill={doctorColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              KM Traveled per {label}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="totalKm"
                  name="KM Traveled"
                  fill={kmColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            TA & DA Amount per {label} (₹)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="totalTA"
                name="TA (₹)"
                fill="#d97706"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="totalDA"
                name="DA (₹)"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div data-ocid="rsm_dashboard.section">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">RSM Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Regional overview — team performance and leave requests
        </p>
      </div>

      {/* Assigned Areas */}
      <Card className="border border-[#E5EAF2] shadow-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            My Assigned Areas ({assignedAreaNames.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedAreaNames.length === 0 ? (
            <p className="text-sm text-gray-400">
              No areas assigned yet. Contact Admin to assign areas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedAreaNames.map((name) => (
                <Badge
                  key={name}
                  className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs font-medium"
                >
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
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

      {/* MR Working Details Overview */}
      <Card className="border border-[#E5EAF2] shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-purple-600" />
            MR Working Details Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            renderCharts(mrChartData, "#7c3aed", "#2563eb", "MR")
          )}
        </CardContent>
      </Card>

      {/* ASM Working Details Overview */}
      <Card className="border border-[#E5EAF2] shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-teal-600" />
            ASM Working Details Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            renderCharts(asmChartData, "#0d9488", "#0891b2", "ASM")
          )}
        </CardContent>
      </Card>

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
            <div className="space-y-3" data-ocid="rsm_dashboard.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : pendingLeaves.length === 0 ? (
            <div
              className="text-center py-10"
              data-ocid="rsm_dashboard.empty_state"
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
                    data-ocid={`rsm_dashboard.item.${listIdx + 1}`}
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
                        data-ocid={`rsm_dashboard.confirm_button.${listIdx + 1}`}
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
                        data-ocid={`rsm_dashboard.delete_button.${listIdx + 1}`}
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
      <HolidayCalendarWidget />
    </div>
  );
}

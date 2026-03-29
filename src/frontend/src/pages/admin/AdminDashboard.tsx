import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, MapPin, Package, Users } from "lucide-react";
import AnnouncementPopup from "../../components/AnnouncementPopup";
import HolidayCalendarWidget from "../../components/HolidayCalendarWidget";
import { useActor } from "../../hooks/useActor";

export default function AdminDashboard() {
  const { actor, isFetching } = useActor();

  const { data: mrProfiles, isLoading: loadingMR } = useQuery({
    queryKey: ["admin", "mrProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMRProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: leaveApps, isLoading: loadingLeaves } = useQuery({
    queryKey: ["admin", "leaveApplications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLeaveApplications();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["admin", "areas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });

  const pendingLeaves =
    leaveApps?.reduce((acc, [, entries]) => {
      return acc + entries.filter((e) => e.status === "Pending").length;
    }, 0) ?? 0;

  const stats = [
    {
      title: "Total MRs",
      value: mrProfiles?.length ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      loading: loadingMR,
    },
    {
      title: "Pending Leaves",
      value: pendingLeaves,
      icon: CalendarCheck,
      color: "text-amber-600",
      bg: "bg-amber-50",
      loading: loadingLeaves,
    },
    {
      title: "Total Areas",
      value: areas?.length ?? 0,
      icon: MapPin,
      color: "text-green-600",
      bg: "bg-green-50",
      loading: loadingAreas,
    },
    {
      title: "Total Products",
      value: products?.length ?? 0,
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50",
      loading: loadingProducts,
    },
  ];

  return (
    <>
      <AnnouncementPopup actor={actor} />
      <div data-ocid="admin_dashboard.section">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
          <p className="text-sm text-gray-500 mt-1">
            System-wide statistics at a glance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="border border-[#E5EAF2] shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  {stat.loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </span>
                  )}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}
                  >
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-[#E5EAF2] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-800">
                Registered MRs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMR ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : mrProfiles?.length === 0 ? (
                <p
                  className="text-sm text-gray-400 text-center py-4"
                  data-ocid="admin_dashboard.empty_state"
                >
                  No MRs registered yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {mrProfiles?.slice(0, 5).map(([principal, profile]) => {
                    const p = principal.toString();
                    const short = `${p.slice(0, 8)}...${p.slice(-4)}`;
                    return (
                      <div
                        key={p}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {profile.employeeCode}
                          </p>
                          <p className="text-xs text-gray-400">{short}</p>
                        </div>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {profile.headQuarter}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-[#E5EAF2] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-800">
                Recent Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLeaves ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : pendingLeaves === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No pending leave requests.
                </p>
              ) : (
                <div className="space-y-2">
                  {leaveApps
                    ?.flatMap(([principal, entries]) =>
                      entries
                        .filter((e) => e.status === "Pending")
                        .map((e, ei) => ({ principal, entry: e, ei })),
                    )
                    .slice(0, 5)
                    .map(({ principal, entry, ei }) => {
                      const p = principal.toString();
                      const short = `${p.slice(0, 8)}...${p.slice(-4)}`;
                      return (
                        <div
                          key={`${p}-${ei}`}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {entry.leaveType}
                            </p>
                            <p className="text-xs text-gray-400">{short}</p>
                          </div>
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
                            Pending
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <HolidayCalendarWidget />
      </div>
    </>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPin, Navigation, Users } from "lucide-react";
import type { LocationData } from "../../backend";
import { useActor } from "../../hooks/useActor";

function getRelativeTime(tsNs: bigint): string {
  const tsMs = Number(tsNs / BigInt(1_000_000));
  const diffMs = Date.now() - tsMs;
  if (diffMs < 0) return "Just now";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.floor(diffHr / 24)} day(s) ago`;
}

function isOnlineRecently(tsNs: bigint): boolean {
  const tsMs = Number(tsNs / BigInt(1_000_000));
  return Date.now() - tsMs < 30 * 60 * 1000; // 30 min
}

function RoleBadge({ role }: { role: string }) {
  const roleColors: Record<string, string> = {
    MR: "bg-blue-100 text-blue-700 border-blue-200",
    ASM: "bg-purple-100 text-purple-700 border-purple-200",
    RSM: "bg-green-100 text-green-700 border-green-200",
    admin: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const cls = roleColors[role] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <Badge variant="outline" className={`text-xs font-semibold ${cls}`}>
      {role}
    </Badge>
  );
}

export default function StaffGPSTracking() {
  const { actor, isFetching } = useActor();
  const enabled = !!actor && !isFetching;

  const {
    data: locations = [],
    isLoading,
    dataUpdatedAt,
  } = useQuery<Array<[Principal, LocationData]>>({
    queryKey: ["allUserLatestLocations"],
    queryFn: () => actor!.getAllUserLatestLocations(),
    enabled,
    refetchInterval: 60_000, // auto-refresh every 60s
  });

  const totalTracked = locations.length;
  const onlineCount = locations.filter(([, loc]) =>
    isOnlineRecently(loc.timestamp),
  ).length;
  const withLocation = locations.filter(
    ([, loc]) => loc.latitude !== 0 || loc.longitude !== 0,
  ).length;

  const lastRefresh = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN")
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Staff GPS Tracking
            </h2>
            <p className="text-sm text-gray-400">
              Live location of all field staff
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            data-ocid="gps_tracking.live.toggle"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            Live
          </span>
          <p className="text-xs text-gray-400 hidden md:block">
            Last updated: {lastRefresh}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Total Staff Tracked
              </p>
              {isLoading ? (
                <Skeleton className="w-12 h-7 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {totalTracked}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Online (Last 30 min)
              </p>
              {isLoading ? (
                <Skeleton className="w-12 h-7 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-emerald-600">
                  {onlineCount}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Locations Available
              </p>
              {isLoading ? (
                <Skeleton className="w-12 h-7 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-purple-600">
                  {withLocation}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">
            All Staff Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              data-ocid="gps_tracking.loading_state"
              className="p-6 space-y-3"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-12 rounded-lg" />
              ))}
            </div>
          ) : locations.length === 0 ? (
            <div
              data-ocid="gps_tracking.empty_state"
              className="text-center py-16"
            >
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">
                No location data available
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Staff locations will appear here once they open the app.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC]">
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Role
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Latitude
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Longitude
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Accuracy (m)
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Last Updated
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map(([principal, loc], idx) => {
                    const online = isOnlineRecently(loc.timestamp);
                    const hasCoords = loc.latitude !== 0 || loc.longitude !== 0;
                    const mapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
                    return (
                      <TableRow
                        key={principal.toString()}
                        data-ocid={`gps_tracking.item.${idx + 1}`}
                        className="hover:bg-[#F8FAFC]"
                      >
                        <TableCell className="text-sm font-semibold text-gray-800">
                          {loc.userName || (
                            <span className="text-gray-400 font-normal">
                              {principal.toString().slice(0, 10)}...
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={loc.userRole || "Unknown"} />
                        </TableCell>
                        <TableCell className="text-sm font-mono text-gray-600">
                          {hasCoords ? (
                            loc.latitude.toFixed(6)
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-gray-600">
                          {hasCoords ? (
                            loc.longitude.toFixed(6)
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {hasCoords ? (
                            `±${Math.round(loc.accuracy)} m`
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {getRelativeTime(loc.timestamp)}
                        </TableCell>
                        <TableCell>
                          {online ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Online
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-gray-500 text-xs"
                            >
                              Offline
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasCoords ? (
                            <Button
                              data-ocid={`gps_tracking.item.${idx + 1}.button`}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 border-blue-200 text-blue-600 hover:bg-blue-50 gap-1"
                              onClick={() =>
                                window.open(
                                  mapsUrl,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                            >
                              <ExternalLink size={12} />
                              View on Map
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Location not available
                            </span>
                          )}
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
    </div>
  );
}

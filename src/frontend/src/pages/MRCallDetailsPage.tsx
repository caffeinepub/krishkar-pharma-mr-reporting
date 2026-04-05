import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  History,
  PhoneCall,
  Stethoscope,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  DetailingEntry,
  Doctor,
  MRProfile,
  ManagerProfile,
  Product,
  UserProfile,
} from "../backend";
import { useActor } from "../hooks/useActor";

export interface MRCallDetailsPageProps {
  viewerRole: "ASM" | "RSM" | "admin";
}

function getLast15DaysRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 14);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const e = new Date(end).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  return `${s} to ${e}`;
}

interface MRCallEntry {
  principalStr: string;
  name: string;
  employeeCode: string;
  headQuarter: string;
  entries: DetailingEntry[];
}

interface DayGroup {
  date: string;
  doctorId: string;
  doctorName: string;
  doctorDetails: string;
  productIds: string[];
}

function groupEntriesByDate(
  entries: DetailingEntry[],
  allDoctors: Doctor[],
  allProducts: Product[],
): { date: string; calls: DayGroup[] }[] {
  const byDate = new Map<string, DayGroup[]>();

  for (const entry of entries) {
    const dateKey = entry.date;
    const doctor = allDoctors.find(
      (d) => String(d.id) === String(entry.doctorId),
    );
    const doctorName = doctor?.name ?? `Doctor #${entry.doctorId}`;
    const doctorDetails = doctor
      ? `${doctor.qualification} · ${doctor.station}`
      : "";

    const group: DayGroup = {
      date: dateKey,
      doctorId: String(entry.doctorId),
      doctorName,
      doctorDetails,
      productIds: entry.productIds.map((id) => {
        const product = allProducts.find((p) => String(p.id) === String(id));
        return product?.name ?? `Product #${id}`;
      }),
    };

    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(group);
  }

  // Sort dates descending
  return Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, calls]) => ({ date, calls }));
}

export default function MRCallDetailsPage({
  viewerRole,
}: MRCallDetailsPageProps) {
  const { actor, isFetching } = useActor();
  const enabled = !!actor && !isFetching;
  const { start, end } = getLast15DaysRange();
  const [hqFilter, setHqFilter] = useState<string>("all");

  const { data: teamDetailingRaw = [], isLoading: detailingLoading } = useQuery<
    [unknown, DetailingEntry[]][]
  >({
    queryKey: ["teamDetailingEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTeamDetailingEntries() as Promise<
        [unknown, DetailingEntry[]][]
      >;
    },
    enabled,
  });

  const { data: allMRProfiles = [], isLoading: mrProfilesLoading } = useQuery<
    [unknown, MRProfile][]
  >({
    queryKey: ["allMRProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMRProfiles() as Promise<[unknown, MRProfile][]>;
    },
    enabled,
  });

  const { data: allUserProfiles = [], isLoading: userProfilesLoading } =
    useQuery<[unknown, UserProfile][]>({
      queryKey: ["allUserProfiles"],
      queryFn: async () => {
        if (!actor) return [];
        return actor.getAllUserProfiles() as Promise<[unknown, UserProfile][]>;
      },
      enabled,
    });

  const { data: allDoctors = [], isLoading: doctorsLoading } = useQuery<
    Doctor[]
  >({
    queryKey: ["doctors"],
    queryFn: () => actor!.getAllDoctors(),
    enabled,
  });

  const { data: allProducts = [], isLoading: productsLoading } = useQuery<
    Product[]
  >({
    queryKey: ["products"],
    queryFn: () => actor!.getAllProducts(),
    enabled,
  });

  const { data: managerProfile = undefined, isLoading: managerLoading } =
    useQuery<ManagerProfile | undefined>({
      queryKey: ["managerProfile"],
      queryFn: async () => {
        if (!actor) return undefined;
        const result = await actor.getManagerProfile();
        return result ?? undefined;
      },
      enabled: enabled && viewerRole !== "admin",
    });

  const isLoading =
    detailingLoading ||
    mrProfilesLoading ||
    userProfilesLoading ||
    doctorsLoading ||
    productsLoading ||
    (viewerRole !== "admin" && managerLoading);

  // Build lookup maps
  const mrProfileMap = useMemo(() => {
    const map = new Map<string, MRProfile>();
    for (const [principal, profile] of allMRProfiles) {
      map.set(String(principal), profile);
    }
    return map;
  }, [allMRProfiles]);

  const userProfileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const [principal, profile] of allUserProfiles) {
      map.set(String(principal), profile);
    }
    return map;
  }, [allUserProfiles]);

  // Determine manager HQ for ASM/RSM
  const managerHQ =
    viewerRole !== "admin" ? (managerProfile?.headQuarter ?? "") : "";

  // All unique HQs from MR profiles (for admin filter)
  const allHQs = useMemo(() => {
    const hqSet = new Set<string>();
    for (const [, profile] of allMRProfiles) {
      if (profile.headQuarter) hqSet.add(profile.headQuarter);
    }
    return Array.from(hqSet).sort();
  }, [allMRProfiles]);

  // Filter and build MR call entries
  const mrCallEntries = useMemo((): MRCallEntry[] => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const result: MRCallEntry[] = [];

    for (const [rawPrincipal, entries] of teamDetailingRaw) {
      const principalStr = String(rawPrincipal);
      const mrProfile = mrProfileMap.get(principalStr);
      const userProfile = userProfileMap.get(principalStr);

      // Filter by HQ
      const mrHQ = mrProfile?.headQuarter ?? "";
      if (viewerRole !== "admin" && managerHQ && mrHQ !== managerHQ) continue;
      if (viewerRole === "admin" && hqFilter !== "all" && mrHQ !== hqFilter)
        continue;

      // Filter entries within last 15 days
      const filteredEntries = entries.filter(
        (entry) => entry.date >= cutoffStr,
      );

      if (filteredEntries.length === 0) continue;

      result.push({
        principalStr,
        name: userProfile?.name ?? `MR (${principalStr.slice(0, 8)}...)`,
        employeeCode:
          mrProfile?.employeeCode ?? userProfile?.employeeCode ?? "",
        headQuarter: mrHQ,
        entries: filteredEntries,
      });
    }

    // Sort by name
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [
    teamDetailingRaw,
    mrProfileMap,
    userProfileMap,
    managerHQ,
    hqFilter,
    viewerRole,
  ]);

  return (
    <div className="space-y-6 max-w-5xl" data-ocid="mr_call_details.section">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#0B2F6B]" />
            MR Call Details — Last 15 Days
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Doctor call activity from{" "}
            <span className="font-medium text-gray-600">
              {formatDateRange(start, end)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {viewerRole !== "admin" && managerHQ && (
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 font-medium">
              <Building2 className="w-3 h-3" />
              HQ: {managerHQ}
            </Badge>
          )}

          {viewerRole === "admin" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">
                Filter by HQ:
              </span>
              <Select value={hqFilter} onValueChange={setHqFilter}>
                <SelectTrigger
                  className="w-44 h-8 text-sm"
                  data-ocid="mr_call_details.select"
                >
                  <SelectValue placeholder="All HQs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All HQs</SelectItem>
                  {allHQs.map((hq) => (
                    <SelectItem key={hq} value={hq}>
                      {hq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4" data-ocid="mr_call_details.loading_state">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-[#E5EAF2]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && mrCallEntries.length === 0 && (
        <Card
          className="border border-[#E5EAF2] text-center py-12"
          data-ocid="mr_call_details.empty_state"
        >
          <CardContent className="pt-6">
            <PhoneCall className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No call data found</p>
            <p className="text-gray-400 text-sm mt-1">
              {viewerRole !== "admin" && managerHQ
                ? `No MR call activity for HQ: ${managerHQ} in the last 15 days.`
                : "No MR call activity in the last 15 days."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* MR Cards */}
      {!isLoading && mrCallEntries.length > 0 && (
        <div className="space-y-4">
          {mrCallEntries.map((mrEntry, idx) => {
            const dayGroups = groupEntriesByDate(
              mrEntry.entries,
              allDoctors,
              allProducts,
            );
            const totalCalls = mrEntry.entries.length;

            return (
              <Card
                key={mrEntry.principalStr}
                className="border border-[#E5EAF2] overflow-hidden"
                data-ocid={`mr_call_details.item.${idx + 1}`}
              >
                <CardHeader className="pb-2 bg-gradient-to-r from-[#F0F5FF] to-white">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0B2F6B]/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-[#0B2F6B]" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-gray-900">
                          {mrEntry.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {mrEntry.employeeCode && (
                            <span className="text-xs text-gray-400">
                              EMP: {mrEntry.employeeCode}
                            </span>
                          )}
                          {mrEntry.headQuarter && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200 py-0 flex items-center gap-1"
                            >
                              <Building2 className="w-3 h-3" />
                              {mrEntry.headQuarter}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-[#0B2F6B] text-white border-0 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" />
                      {totalCalls} Call{totalCalls !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-3 px-3">
                  <Accordion type="multiple" className="w-full">
                    {dayGroups.map(({ date, calls }) => (
                      <AccordionItem
                        key={date}
                        value={date}
                        className="border-0 border-b border-[#E5EAF2] last:border-b-0"
                      >
                        <AccordionTrigger className="py-2.5 hover:no-underline">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="w-4 h-4 text-[#0B2F6B]" />
                            <span className="font-semibold text-gray-700">
                              {formatDate(date)}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs bg-gray-50 text-gray-500 border-gray-200 py-0 ml-1"
                            >
                              {calls.length} doctor
                              {calls.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2 pt-0">
                          <div className="space-y-2 pl-1">
                            {calls.map((call, callIdx) => (
                              <div
                                key={`${call.doctorId}-${callIdx}`}
                                className="rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] p-3 space-y-2"
                              >
                                <div className="flex items-start gap-2 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                                      <Stethoscope className="w-3.5 h-3.5 text-[#0B2F6B] flex-shrink-0" />
                                      {call.doctorName}
                                    </p>
                                    {call.doctorDetails && (
                                      <p className="text-xs text-gray-400 mt-0.5 pl-5">
                                        {call.doctorDetails}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {call.productIds.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                      Products Detailed
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {call.productIds.map((productName) => (
                                        <Badge
                                          key={productName}
                                          className="bg-blue-100 text-blue-700 border-0 text-xs font-medium"
                                        >
                                          {productName}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {call.productIds.length === 0 && (
                                  <p className="text-xs text-gray-400 italic">
                                    No products detailed
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

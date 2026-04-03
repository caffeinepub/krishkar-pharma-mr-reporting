import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  FlaskConical,
  Gift,
  History,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { useMemo } from "react";
import type {
  Area,
  Doctor,
  DoctorId,
  Product,
  RecentDoctorCallEntry,
} from "../backend";
import { useActor } from "../hooks/useActor";

function getLast5DaysRange(): { start: string; end: string; dates: string[] } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 4);
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    dates,
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

interface CallEntryRowProps {
  entry: RecentDoctorCallEntry;
  products: Product[];
}

function CallEntryRow({ entry, products }: CallEntryRowProps) {
  const productNames = entry.productIds.map((id) => {
    const found = products.find((p) => String(p.id) === String(id));
    return found?.name ?? `Product #${id}`;
  });

  return (
    <div className="rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
        >
          <CalendarDays className="w-3 h-3" />
          {formatDate(entry.date)}
        </Badge>
      </div>

      {productNames.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <Stethoscope className="w-3 h-3" /> Products Detailed
          </p>
          <div className="flex flex-wrap gap-1">
            {productNames.map((name) => (
              <Badge
                key={name}
                className="bg-blue-100 text-blue-700 border-0 text-xs font-medium"
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {entry.samples.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <FlaskConical className="w-3 h-3 text-teal-500" /> Samples Given
          </p>
          <div className="flex flex-wrap gap-1">
            {entry.samples.map((s) => {
              const pName =
                products.find((p) => String(p.id) === String(s.productId))
                  ?.name ?? `Product #${s.productId}`;
              return (
                <Badge
                  key={String(s.productId)}
                  className="bg-teal-50 text-teal-700 border border-teal-200 text-xs"
                >
                  {pName} × {String(s.quantity)}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {entry.gifts.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <Gift className="w-3 h-3 text-purple-500" /> Gifts Given
          </p>
          <div className="flex flex-wrap gap-1">
            {entry.gifts.map((g) => (
              <Badge
                key={g.giftArticleName}
                className="bg-purple-50 text-purple-700 border border-purple-200 text-xs"
              >
                {g.giftArticleName} × {String(g.quantity)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorCallHistoryPage() {
  const { actor, isFetching } = useActor();
  const enabled = !!actor && !isFetching;
  const { start, end } = getLast5DaysRange();

  const { data: recentCalls = [], isLoading: callsLoading } = useQuery<
    RecentDoctorCallEntry[]
  >({
    queryKey: ["recentDoctorCalls", 5],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentDoctorCalls(BigInt(5));
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

  const { data: allAreas = [], isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ["areas"],
    queryFn: () => actor!.getAllAreas(),
    enabled,
  });

  const { data: allProducts = [], isLoading: productsLoading } = useQuery<
    Product[]
  >({
    queryKey: ["products"],
    queryFn: () => actor!.getAllProducts(),
    enabled,
  });

  const isLoading =
    callsLoading || doctorsLoading || areasLoading || productsLoading;

  // Group: areaId -> doctorId -> entries[]
  const grouped = useMemo(() => {
    const byArea = new Map<string, Map<string, RecentDoctorCallEntry[]>>();

    for (const entry of recentCalls) {
      const areaKey = String(entry.areaId);
      const docKey = String(entry.doctorId);
      if (!byArea.has(areaKey)) byArea.set(areaKey, new Map());
      const byDoc = byArea.get(areaKey)!;
      if (!byDoc.has(docKey)) byDoc.set(docKey, []);
      byDoc.get(docKey)!.push(entry);
    }

    return byArea;
  }, [recentCalls]);

  const areaIds = Array.from(grouped.keys());

  const getAreaName = (areaId: string) =>
    allAreas.find((a) => String(a.id) === areaId)?.name ?? `Area #${areaId}`;

  const getDoctorName = (doctorId: string) =>
    allDoctors.find((d) => String(d.id) === doctorId)?.name ??
    `Doctor #${doctorId}`;

  const getDoctorDetails = (doctorId: string) => {
    const doc = allDoctors.find((d) => String(d.id) === doctorId);
    return doc ? `${doc.qualification} · ${doc.station}` : "";
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#0B2F6B]" />
            Call History — Last 5 Days
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Doctor call activity from{" "}
            <span className="font-medium text-gray-600">
              {formatDate(start)}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-600">{formatDate(end)}</span>
          </p>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4" data-ocid="call_history.loading_state">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-[#E5EAF2]">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && recentCalls.length === 0 && (
        <Card
          className="border border-[#E5EAF2] bg-white"
          data-ocid="call_history.empty_state"
        >
          <CardContent className="py-16 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <History className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-base font-semibold text-gray-700">
              No doctor calls recorded
            </p>
            <p className="text-sm text-gray-400 max-w-xs">
              No doctor call activity found in the last 5 days. Start logging
              doctor visits in Working Details.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Area-grouped accordion */}
      {!isLoading && areaIds.length > 0 && (
        <Accordion
          type="multiple"
          defaultValue={areaIds}
          className="space-y-3"
          data-ocid="call_history.list"
        >
          {areaIds.map((areaId, areaIdx) => {
            const docMap = grouped.get(areaId)!;
            const docIds = Array.from(docMap.keys());
            const totalCalls = Array.from(docMap.values()).reduce(
              (sum, entries) => sum + entries.length,
              0,
            );

            return (
              <AccordionItem
                key={areaId}
                value={areaId}
                data-ocid={`call_history.item.${areaIdx + 1}`}
                className="border border-[#E5EAF2] rounded-xl overflow-hidden shadow-sm bg-white"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-[#F8FAFC] [&[data-state=open]]:bg-[#F0F5FF]">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-[#0B2F6B]" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {getAreaName(areaId)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {docIds.length} doctor{docIds.length !== 1 ? "s" : ""} ·{" "}
                        {totalCalls} call{totalCalls !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge className="ml-auto mr-2 bg-blue-100 text-blue-700 border-0 text-xs flex-shrink-0">
                      {totalCalls}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-5 pb-4 pt-0">
                  <div className="space-y-4 mt-2">
                    {docIds.map((docId) => {
                      const entries = docMap.get(docId)!;
                      // Sort by date desc
                      const sorted = [...entries].sort((a, b) =>
                        b.date.localeCompare(a.date),
                      );
                      return (
                        <div
                          key={docId}
                          className="border border-[#E5EAF2] rounded-xl overflow-hidden"
                        >
                          {/* Doctor header */}
                          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#F0F5FF] to-[#F8FAFC] border-b border-[#E5EAF2]">
                            <div className="w-7 h-7 rounded-full bg-[#0B2F6B] flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {getDoctorName(docId)}
                              </p>
                              {getDoctorDetails(docId) && (
                                <p className="text-xs text-gray-400">
                                  {getDoctorDetails(docId)}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className="ml-auto text-xs text-gray-500 flex-shrink-0"
                            >
                              {sorted.length} visit
                              {sorted.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>

                          {/* Call entries */}
                          <div className="p-3 space-y-2">
                            {sorted.map((entry) => (
                              <CallEntryRow
                                key={entry.date}
                                entry={entry}
                                products={allProducts}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

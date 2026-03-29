import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDayName(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "long" });
}

function isSunday(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getDay() === 0;
}

function isPast(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  return d < today;
}

const MAX_VISIBLE = 6;

export default function HolidayCalendarWidget() {
  const { actor, isFetching } = useActor();
  const [expanded, setExpanded] = useState(false);

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllHolidays();
    },
    enabled: !!actor && !isFetching,
  });

  const currentYear = new Date().getFullYear();
  const sorted = (holidays ?? [])
    .filter((h) => h.date.startsWith(String(currentYear)))
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcoming = sorted.filter((h) => !isPast(h.date));
  const past = sorted.filter((h) => isPast(h.date));
  const allForYear = [...upcoming, ...past];

  const visibleHolidays = expanded
    ? allForYear
    : upcoming.slice(0, MAX_VISIBLE);
  const hasMore = upcoming.length > MAX_VISIBLE || past.length > 0;

  return (
    <Card
      className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl"
      data-ocid="holiday_calendar.card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">
                Company Holidays {currentYear}
              </CardTitle>
              {!isLoading && (
                <p className="text-xs text-gray-400">
                  {upcoming.length} upcoming · {past.length} passed
                </p>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-600 border-orange-200 text-xs"
          >
            {isLoading ? "..." : `${sorted.length} total`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3" data-ocid="holiday_calendar.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="text-center py-8"
            data-ocid="holiday_calendar.empty_state"
          >
            <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              No holidays scheduled
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Admin can add holidays from the Admin Portal.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleHolidays.map((holiday, idx) => {
              const past = isPast(holiday.date);
              const sunday = isSunday(holiday.date);
              return (
                <div
                  key={String(holiday.id)}
                  data-ocid={`holiday_calendar.item.${idx + 1}`}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    past
                      ? "bg-gray-50 border-gray-100 opacity-60"
                      : sunday
                        ? "bg-red-50 border-red-100"
                        : "bg-orange-50/50 border-orange-100"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                      past
                        ? "bg-gray-200 text-gray-500"
                        : sunday
                          ? "bg-red-500 text-white"
                          : "bg-orange-500 text-white"
                    }`}
                  >
                    <span className="text-xs font-bold leading-none">
                      {new Date(`${holiday.date}T00:00:00`).getDate()}
                    </span>
                    <span className="text-[10px] leading-none opacity-80">
                      {new Date(`${holiday.date}T00:00:00`).toLocaleDateString(
                        "en-IN",
                        { month: "short" },
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-sm font-semibold ${
                          past ? "text-gray-500" : "text-gray-800"
                        }`}
                      >
                        {holiday.name}
                      </p>
                      {sunday && !past && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 bg-red-100 text-red-600 border-red-200"
                        >
                          Sunday
                        </Badge>
                      )}
                      {past && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 bg-gray-100 text-gray-400 border-gray-200"
                        >
                          Passed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(holiday.date)} · {getDayName(holiday.date)}
                    </p>
                    {holiday.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {holiday.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-500 hover:text-gray-700 mt-1"
                data-ocid="holiday_calendar.toggle"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" /> View all{" "}
                    {allForYear.length} holidays
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

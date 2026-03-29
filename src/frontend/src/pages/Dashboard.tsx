import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarCheck,
  ClipboardList,
  FlaskConical,
  Loader2,
  ShoppingBag,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivitySummary } from "../backend";
import AnnouncementPopup from "../components/AnnouncementPopup";
import HolidayCalendarWidget from "../components/HolidayCalendarWidget";
import { useActor } from "../hooks/useActor";

const weeklyData = [
  { day: "Mon", doctors: 4, samples: 6, orders: 2 },
  { day: "Tue", doctors: 6, samples: 9, orders: 4 },
  { day: "Wed", doctors: 3, samples: 5, orders: 1 },
  { day: "Thu", doctors: 7, samples: 11, orders: 5 },
  { day: "Fri", doctors: 5, samples: 8, orders: 3 },
  { day: "Sat", doctors: 2, samples: 3, orders: 1 },
  { day: "Sun", doctors: 1, samples: 2, orders: 0 },
];

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: bg }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const recentActivity = [
  {
    id: "a1",
    time: "10:30 AM",
    action: "Visited Dr. Ramesh Sharma",
    type: "Doctor Visit",
    area: "Sector 12",
  },
  {
    id: "a2",
    time: "11:15 AM",
    action: "Gave Krishgel Cream sample (x3)",
    type: "Sample",
    area: "Sector 12",
  },
  {
    id: "a3",
    time: "12:00 PM",
    action: "Order placed at Agarwal Medical",
    type: "Order",
    area: "MG Road",
  },
  {
    id: "a4",
    time: "02:30 PM",
    action: "Visited Dr. Priya Gupta",
    type: "Doctor Visit",
    area: "Sector 8",
  },
  {
    id: "a5",
    time: "03:45 PM",
    action: "Expense logged: 45 KM, DA ₹300",
    type: "Expense",
    area: "-",
  },
];

const legendItems = [
  { color: "#2563EB", label: "Doctors" },
  { color: "#14B8A6", label: "Samples" },
  { color: "#F59E0B", label: "Orders" },
];

export default function Dashboard({
  onAddWorkingDetails,
}: { onAddWorkingDetails?: () => void }) {
  const { actor, isFetching } = useActor();
  const today = new Date().toISOString().split("T")[0];

  const { data: summary, isLoading } = useQuery<ActivitySummary>({
    queryKey: ["activity-summary", today],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getActivitySummary(today);
    },
    enabled: !!actor && !isFetching,
  });

  const leaveBalance = summary?.leaveBalance
    ? summary.leaveBalance.reduce((acc, [, days]) => acc + Number(days), 0)
    : 24;

  return (
    <>
      <AnnouncementPopup actor={actor} />
      <div className="space-y-6">
        {/* Add Working Details CTA */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-600">
              Today's Overview
            </h2>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {onAddWorkingDetails && (
            <Button
              data-ocid="dashboard.add_working_details.primary_button"
              className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white font-semibold px-5"
              onClick={onAddWorkingDetails}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Add Working Details
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard
            title="Doctors Visited"
            value={isLoading ? "..." : String(summary?.doctorsVisited ?? 0)}
            subtitle="Today"
            icon={Stethoscope}
            color="#2563EB"
            bg="#EFF6FF"
          />
          <KPICard
            title="Samples Given"
            value={isLoading ? "..." : String(summary?.samplesGiven ?? 0)}
            subtitle="Today"
            icon={FlaskConical}
            color="#14B8A6"
            bg="#F0FDFA"
          />
          <KPICard
            title="Chemist Orders"
            value={isLoading ? "..." : String(summary?.chemistOrders ?? 0)}
            subtitle="Pending"
            icon={ShoppingBag}
            color="#F59E0B"
            bg="#FFFBEB"
          />
          <KPICard
            title="Leave Balance"
            value={isLoading ? "..." : leaveBalance}
            subtitle="Days remaining"
            icon={CalendarCheck}
            color="#7C3AED"
            bg="#F5F3FF"
          />
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Bar Chart */}
          <Card className="lg:col-span-3 bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Weekly Activity Overview
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} barSize={10} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #E5EAF2",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="doctors"
                    fill="#2563EB"
                    name="Doctors"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="samples"
                    fill="#14B8A6"
                    name="Samples"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="orders"
                    fill="#F59E0B"
                    name="Orders"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                {legendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Recent Activity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#F1F5F9]">
                {recentActivity.map((item, idx) => (
                  <div
                    key={item.id}
                    data-ocid={`activity.item.${idx + 1}`}
                    className="px-5 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {item.action}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.time} · {item.area}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                          item.type === "Doctor Visit"
                            ? "bg-blue-50 text-blue-600"
                            : item.type === "Sample"
                              ? "bg-teal-50 text-teal-600"
                              : item.type === "Order"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily expense summary */}
        {summary && Number(summary.dailyExpense) > 0 && (
          <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">₹</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    Today's Expense
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{Number(summary.dailyExpense).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div
            className="flex justify-center py-4"
            data-ocid="dashboard.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <HolidayCalendarWidget />
      </div>
    </>
  );
}

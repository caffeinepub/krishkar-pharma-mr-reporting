import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useActor } from "@/hooks/useActor";
import { CalendarDays, Loader2, MapPin, User2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ManagerProfile, UserProfile, WorkingPlan } from "../../backend";

interface MonthOption {
  value: string;
  label: string;
}

function getMonthOptions(): MonthOption[] {
  const now = new Date();
  const options: MonthOption[] = [];
  for (let i = -1; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    options.push({ value, label });
  }
  return options;
}

export default function AdminWorkingPlans() {
  const { actor } = useActor();
  const [plans, setPlans] = useState<WorkingPlan[]>([]);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const monthOptions = getMonthOptions();

  useEffect(() => {
    if (!actor) return;
    setLoading(true);
    actor
      .adminGetAllWorkingPlans()
      .then((result) => setPlans(result))
      .catch(() => toast.error("Failed to load working plans"))
      .finally(() => setLoading(false));
  }, [actor]);

  useEffect(() => {
    if (!actor) return;
    Promise.all([actor.getAllUserProfiles(), actor.getAllManagerProfiles()])
      .then(([userProfiles, managerProfiles]) => {
        const map = new Map<string, string>();
        for (const [principal, profile] of userProfiles) {
          map.set(
            principal.toString(),
            (profile as UserProfile).name || "Unknown",
          );
        }
        for (const [principal, profile] of managerProfiles) {
          map.set(
            principal.toString(),
            (profile as ManagerProfile).name || "Unknown",
          );
        }
        setNameMap(map);
      })
      .catch(() => {});
  }, [actor]);

  const filteredPlans = plans
    .filter((p) => p.date.slice(0, 7) === selectedMonth)
    .filter((p) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return p.content.toLowerCase().includes(term) || p.date.includes(term);
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const stationLabel = (type: string) =>
    type === "plan" ? "As Per Working Plan" : "Other Station";

  const stationColor = (type: string) =>
    type === "plan"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-orange-100 text-orange-700 border-orange-200";

  const selectedMonthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">All Working Plans</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          View working plans submitted by all staff
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger
            className="w-full sm:w-52"
            data-ocid="admin_working_plans.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          data-ocid="admin_working_plans.search_input"
          placeholder="Search by description or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays size={16} className="text-[#0B2F6B]" />
            Working Plans — {selectedMonthLabel}
            <Badge variant="outline" className="ml-auto text-xs">
              {filteredPlans.length} record
              {filteredPlans.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div
              data-ocid="admin_working_plans.loading_state"
              className="flex items-center justify-center py-12 text-gray-400 gap-2"
            >
              <Loader2 className="animate-spin" size={20} />
              <span>Loading...</span>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div
              data-ocid="admin_working_plans.empty_state"
              className="flex flex-col items-center justify-center py-12 text-gray-400"
            >
              <CalendarDays size={40} className="mb-3 opacity-30" />
              <p className="font-medium">
                No working plans for {selectedMonthLabel}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Description
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Working Mode
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Working With
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Station Type
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Added By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan, idx) => (
                  <TableRow
                    key={String(plan.id)}
                    data-ocid={`admin_working_plans.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(`${plan.date}T00:00:00`).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {plan.content}
                      </p>
                    </TableCell>
                    <TableCell>
                      {plan.workingMode === "alone" ? (
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-600 border-gray-200"
                        >
                          Alone
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 gap-1"
                        >
                          <User2 size={12} /> With Someone
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {plan.workingWith ?? (
                          <span className="text-gray-300">—</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${stationColor(plan.stationType)}`}
                      >
                        <MapPin size={11} className="mr-1" />
                        {stationLabel(plan.stationType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {nameMap.get(plan.principalId.toString()) || (
                        <span className="text-gray-400 text-xs font-mono">
                          {plan.principalId.toString().slice(0, 8)}...
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { useState } from "react";
import { loadXlsx } from "../lib/xlsxLoader";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

interface DetailingEntry {
  doctorId: any;
  date: string;
  productIds: any[];
}

interface ExpenseEntry {
  date: string;
  taAmount: any;
  daAmount: any;
  [key: string]: any;
}

interface Props {
  mrPrincipalSet: Set<string>;
  teamDetailing: Array<[any, any[]]>;
  teamExpenses: Array<[any, any[]]>;
  getUserName: (p: string) => string;
  getDoctorName: (id: any) => string;
  getProductNames: (ids: any[]) => string;
}

export function MRWorkingOverview({
  mrPrincipalSet,
  teamDetailing,
  teamExpenses,
  getUserName,
  getDoctorName,
  getProductNames,
}: Props) {
  const now = new Date();
  const [overviewView, setOverviewView] = useState<"monthly" | "daily">(
    "monthly",
  );
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    now.toISOString().slice(0, 10),
  );

  const mrList = Array.from(mrPrincipalSet);

  // Build maps: mrPrincipal -> entries
  const mrDetailingMap = new Map<string, DetailingEntry[]>();
  const mrExpenseMap = new Map<string, ExpenseEntry[]>();

  for (const [p, entries] of teamDetailing) {
    const pStr = p.toString();
    if (mrPrincipalSet.has(pStr)) {
      mrDetailingMap.set(pStr, entries as DetailingEntry[]);
    }
  }
  for (const [p, entries] of teamExpenses) {
    const pStr = p.toString();
    if (mrPrincipalSet.has(pStr)) {
      mrExpenseMap.set(pStr, entries as ExpenseEntry[]);
    }
  }

  // ── MONTHLY VIEW ──
  const totalDays = daysInMonth(selectedYear, selectedMonth);
  const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1);

  // For each MR + day, count detailing entries
  function monthlyCell(pStr: string, day: number) {
    const yyyy = selectedYear;
    const mm = String(selectedMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const entries = mrDetailingMap.get(pStr) || [];
    return entries.filter((e) => e.date === dateStr).length;
  }

  function totalDaysWorked(pStr: string) {
    const yyyy = selectedYear;
    const mm = String(selectedMonth + 1).padStart(2, "0");
    const workedDays = new Set<string>();
    const entries = mrDetailingMap.get(pStr) || [];
    for (const e of entries) {
      if (e.date.startsWith(`${yyyy}-${mm}`)) {
        workedDays.add(e.date);
      }
    }
    return workedDays.size;
  }

  const exportMonthly = async () => {
    const XLSX = await loadXlsx();
    const data = mrList.map((pStr) => {
      const row: Record<string, any> = { "MR Name": getUserName(pStr) };
      for (const day of dayNumbers) {
        const count = monthlyCell(pStr, day);
        row[String(day)] = count > 0 ? count : "";
      }
      row["Total Days Worked"] = totalDaysWorked(pStr);
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Overview");
    XLSX.writeFile(
      wb,
      `MR_Monthly_Overview_${MONTHS[selectedMonth]}_${selectedYear}.xlsx`,
    );
  };

  // ── DAILY VIEW ──
  function dailySummary(pStr: string) {
    const entries = (mrDetailingMap.get(pStr) || []).filter(
      (e) => e.date === selectedDate,
    );
    const doctorsVisited = new Set(entries.map((e) => e.doctorId.toString()));
    const productIds = new Set(
      entries.flatMap(
        (e) => e.productIds?.map((id: any) => id.toString()) || [],
      ),
    );
    const doctorNames = Array.from(doctorsVisited)
      .map(getDoctorName)
      .join(", ");
    const productNames =
      productIds.size > 0 ? getProductNames(Array.from(productIds)) : "-";

    const expenses = (mrExpenseMap.get(pStr) || []).filter(
      (e) => e.date === selectedDate,
    );
    const totalTA = expenses.reduce((s, e) => s + Number(e.taAmount), 0);
    const totalDA = expenses.reduce((s, e) => s + Number(e.daAmount), 0);

    return {
      doctorsCount: doctorsVisited.size,
      doctorNames: doctorNames || "-",
      productNames,
      totalTADA: totalTA + totalDA,
      hasActivity: entries.length > 0,
    };
  }

  const dailyRows = mrList
    .map((pStr) => ({ pStr, ...dailySummary(pStr) }))
    .filter((r) => r.hasActivity);

  const exportDaily = async () => {
    const XLSX = await loadXlsx();
    const data = dailyRows.map((r, i) => ({
      "#": i + 1,
      "MR Name": getUserName(r.pStr),
      "Doctors Visited": r.doctorsCount,
      "Doctor Names": r.doctorNames,
      "Products Detailed": r.productNames,
      "Total TA+DA (₹)": r.totalTADA.toFixed(2),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Overview");
    XLSX.writeFile(wb, `MR_Daily_Overview_${selectedDate}.xlsx`);
  };

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => now.getFullYear() - 2 + i,
  );

  return (
    <Tabs
      value={overviewView}
      onValueChange={(v) => setOverviewView(v as "monthly" | "daily")}
    >
      <TabsList className="mb-4">
        <TabsTrigger value="monthly" data-ocid="mr_overview.monthly.tab">
          Monthly
        </TabsTrigger>
        <TabsTrigger value="daily" data-ocid="mr_overview.daily.tab">
          Daily
        </TabsTrigger>
      </TabsList>

      {/* ── MONTHLY ── */}
      <TabsContent value="monthly">
        <Card className="border border-[#E5EAF2] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              Monthly Working Overview
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger
                  className="h-8 text-xs w-32"
                  data-ocid="mr_overview.monthly.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger
                  className="h-8 text-xs w-24"
                  data-ocid="mr_overview.year.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={exportMonthly}
                className="gap-2 text-xs h-8"
                data-ocid="mr_overview.monthly.button"
              >
                <Download size={14} /> Export Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {mrList.length === 0 ? (
              <div
                className="text-center py-10"
                data-ocid="mr_overview.monthly.empty_state"
              >
                <p className="text-gray-400 text-sm">No MR data available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 min-w-[130px]">
                        MR Name
                      </TableHead>
                      {dayNumbers.map((d) => (
                        <TableHead
                          key={d}
                          className="text-center px-1 min-w-[32px] text-xs"
                        >
                          {d}
                        </TableHead>
                      ))}
                      <TableHead className="text-center min-w-[90px] bg-green-50 text-green-700 font-semibold">
                        Days Worked
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mrList.map((pStr, idx) => {
                      const daysWorked = totalDaysWorked(pStr);
                      return (
                        <TableRow
                          key={pStr}
                          data-ocid={`mr_overview.monthly.row.${idx + 1}`}
                        >
                          <TableCell className="sticky left-0 bg-white z-10 font-medium text-sm text-gray-800 whitespace-nowrap">
                            <Badge
                              variant="secondary"
                              className="bg-purple-50 text-purple-700 text-xs"
                            >
                              {getUserName(pStr)}
                            </Badge>
                          </TableCell>
                          {dayNumbers.map((d) => {
                            const count = monthlyCell(pStr, d);
                            return (
                              <TableCell
                                key={d}
                                className="text-center px-1 py-1"
                              >
                                {count > 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                    {count}
                                  </span>
                                ) : (
                                  <span className="text-gray-200 text-xs">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center bg-green-50">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-green-600 text-white text-xs font-bold">
                              {daysWorked}
                            </span>
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
      </TabsContent>

      {/* ── DAILY ── */}
      <TabsContent value="daily">
        <Card className="border border-[#E5EAF2] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              Daily Working Overview
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 border border-gray-200 rounded px-2 text-sm"
                data-ocid="mr_overview.daily.input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={exportDaily}
                className="gap-2 text-xs h-8"
                data-ocid="mr_overview.daily.button"
              >
                <Download size={14} /> Export Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dailyRows.length === 0 ? (
              <div
                className="text-center py-10"
                data-ocid="mr_overview.daily.empty_state"
              >
                <p className="text-gray-400 text-sm">
                  No MR activity recorded for {selectedDate}.
                </p>
              </div>
            ) : (
              <div
                className="overflow-x-auto"
                data-ocid="mr_overview.daily.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>MR Name</TableHead>
                      <TableHead className="text-center">
                        Doctors Visited
                      </TableHead>
                      <TableHead>Doctor Names</TableHead>
                      <TableHead>Products Detailed</TableHead>
                      <TableHead className="text-right">
                        Total TA+DA (₹)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyRows.map((r, idx) => (
                      <TableRow
                        key={r.pStr}
                        data-ocid={`mr_overview.daily.row.${idx + 1}`}
                      >
                        <TableCell className="text-gray-500 text-sm">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-purple-50 text-purple-700 text-xs"
                          >
                            {getUserName(r.pStr)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                            {r.doctorsCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 max-w-[180px]">
                          {r.doctorNames}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[180px]">
                          {r.productNames}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-gray-800">
                          ₹{r.totalTADA.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

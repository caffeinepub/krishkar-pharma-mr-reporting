import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";

import { MRWorkingOverview } from "../../components/MRWorkingOverview";
import { useActor } from "../../hooks/useActor";
import { loadXlsx } from "../../lib/xlsxLoader";

function daTypeBadge(daType: string) {
  if (daType === "Head Quarter" || daType === "HQ") {
    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
        HQ
      </Badge>
    );
  }
  if (daType === "Out Station") {
    return (
      <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-medium">
        Out Station
      </Badge>
    );
  }
  if (daType === "Ex-Station") {
    return (
      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-medium">
        Ex-Station
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      {daType || "-"}
    </Badge>
  );
}

function DateFilter({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onClear,
}: {
  fromDate: string;
  toDate: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-gray-600">From Date</Label>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-8 text-sm w-36"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-gray-600">To Date</Label>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          className="h-8 text-sm w-36"
        />
      </div>
      {(fromDate || toDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 text-xs text-gray-500"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

function filterByDate(rows: any[], fromDate: string, toDate: string) {
  return rows.filter(({ entry }) => {
    const d = entry.date;
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });
}

export default function RSMTeamReports() {
  const { actor, isFetching } = useActor();
  const enabled = !!actor && !isFetching;

  const [mrDetailFrom, setMrDetailFrom] = useState("");
  const [mrDetailTo, setMrDetailTo] = useState("");
  const [mrExpFrom, setMrExpFrom] = useState("");
  const [mrExpTo, setMrExpTo] = useState("");
  const [asmFrom, setAsmFrom] = useState("");
  const [asmTo, setAsmTo] = useState("");

  const { data: teamDetailing = [], isLoading: loadingDetailing } = useQuery({
    queryKey: ["rsm", "teamDetailing"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTeamDetailingEntries();
    },
    enabled,
  });

  const { data: teamExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["rsm", "teamExpenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTeamExpenseEntries();
    },
    enabled,
  });

  const { data: allUserProfiles = [] } = useQuery({
    queryKey: ["rsm", "allUserProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserProfiles();
    },
    enabled,
  });

  const { data: allManagerProfiles = [] } = useQuery({
    queryKey: ["rsm", "allManagerProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllManagerProfiles();
    },
    enabled,
  });

  const { data: allMRProfiles = [] } = useQuery({
    queryKey: ["rsm", "allMRProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMRProfiles();
    },
    enabled,
  });

  const { data: allDoctors = [] } = useQuery({
    queryKey: ["rsm", "allDoctors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDoctors();
    },
    enabled,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["rsm", "allProducts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled,
  });

  const mrPrincipalSet = new Set<string>();
  for (const [p] of allMRProfiles as Array<[any, any]>)
    mrPrincipalSet.add(p.toString());

  const asmPrincipalSet = new Set<string>();
  for (const [p, profile] of allManagerProfiles as Array<[any, any]>) {
    const role = Array.isArray(profile.managerRole)
      ? profile.managerRole[0]
      : profile.managerRole;
    if (role === "ASM") asmPrincipalSet.add(p.toString());
  }

  const profileMap = new Map<string, string>();
  for (const [p, profile] of allUserProfiles as Array<[any, any]>)
    profileMap.set(p.toString(), profile.name);
  for (const [p, profile] of allManagerProfiles as Array<[any, any]>) {
    if (!profileMap.has(p.toString()))
      profileMap.set(
        p.toString(),
        profile.name || `${p.toString().slice(0, 8)}...`,
      );
  }

  const doctorMap = new Map<string, string>();
  for (const doctor of allDoctors as Array<any>)
    doctorMap.set(doctor.id.toString(), doctor.name);

  const productMap = new Map<string, string>();
  for (const product of allProducts as Array<any>)
    productMap.set(product.id.toString(), product.name);

  const getUserName = (p: string) => profileMap.get(p) || `${p.slice(0, 8)}...`;
  const getDoctorName = (id: any) =>
    doctorMap.get(id.toString()) || `Doctor #${id}`;
  const getProductNames = (ids: any[]) =>
    !ids?.length
      ? "-"
      : ids.map((id) => productMap.get(id.toString()) || `#${id}`).join(", ");

  const mrDetailingRows = (teamDetailing as Array<[any, any[]]>)
    .filter(([p]) => mrPrincipalSet.has(p.toString()))
    .flatMap(([p, entries]) =>
      entries.map((entry: any) => ({
        pStr: p.toString(),
        entry,
        rowKey: `${p}-${entry.date}-${entry.doctorId}`,
      })),
    );

  const mrExpenseRows = (teamExpenses as Array<[any, any[]]>)
    .filter(([p]) => mrPrincipalSet.has(p.toString()))
    .flatMap(([p, entries]) =>
      entries.map((entry: any) => ({
        pStr: p.toString(),
        entry,
        rowKey: `${p}-${entry.date}-${entry.kmTraveled}`,
      })),
    );

  const asmExpenseRows = (teamExpenses as Array<[any, any[]]>)
    .filter(([p]) => asmPrincipalSet.has(p.toString()))
    .flatMap(([p, entries]) =>
      entries.map((entry: any) => ({
        pStr: p.toString(),
        entry,
        rowKey: `${p}-${entry.date}-${entry.kmTraveled}`,
      })),
    );

  const filteredMrDetailingRows = filterByDate(
    mrDetailingRows,
    mrDetailFrom,
    mrDetailTo,
  );
  const filteredMrExpenseRows = filterByDate(mrExpenseRows, mrExpFrom, mrExpTo);
  const filteredAsmExpenseRows = filterByDate(asmExpenseRows, asmFrom, asmTo);

  const exportMrDetailing = async () => {
    const XLSX = await loadXlsx();
    const data = filteredMrDetailingRows.map(({ pStr, entry }, i) => ({
      "#": i + 1,
      "MR Name": getUserName(pStr),
      Date: entry.date,
      Doctor: getDoctorName(entry.doctorId),
      "Products Detailed": getProductNames(entry.productIds),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MR Detailing");
    XLSX.writeFile(wb, "MR_Detailing_Report.xlsx");
  };

  const exportMrExpenses = async () => {
    const XLSX = await loadXlsx();
    const data = filteredMrExpenseRows.map(({ pStr, entry }, i) => ({
      "#": i + 1,
      "MR Name": getUserName(pStr),
      Date: entry.date,
      KM: Number(entry.kmTraveled),
      "TA (₹)": Number(entry.taAmount).toFixed(2),
      "DA (₹)": Number(entry.daAmount).toFixed(2),
      "DA Type": entry.daType || "-",
      "Working Area": entry.workingArea || "-",
      "Total (₹)": (Number(entry.taAmount) + Number(entry.daAmount)).toFixed(2),
      "GPS Latitude":
        entry.latitude != null ? Number(entry.latitude).toFixed(6) : "-",
      "GPS Longitude":
        entry.longitude != null ? Number(entry.longitude).toFixed(6) : "-",
      "GPS Location":
        entry.latitude != null && entry.longitude != null
          ? `https://maps.google.com/?q=${Number(entry.latitude).toFixed(6)},${Number(entry.longitude).toFixed(6)}`
          : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MR Expenses");
    XLSX.writeFile(wb, "MR_Expenses_Report.xlsx");
  };

  const exportAsmExpenses = async () => {
    const XLSX = await loadXlsx();
    const data = filteredAsmExpenseRows.map(({ pStr, entry }, i) => ({
      "#": i + 1,
      "ASM Name": getUserName(pStr),
      Date: entry.date,
      KM: Number(entry.kmTraveled),
      "TA (₹)": Number(entry.taAmount).toFixed(2),
      "DA (₹)": Number(entry.daAmount).toFixed(2),
      "DA Type": entry.daType || "-",
      "Working Area": entry.workingArea || "-",
      Notes: entry.notes || "-",
      "GPS Latitude":
        entry.latitude != null ? Number(entry.latitude).toFixed(6) : "-",
      "GPS Longitude":
        entry.longitude != null ? Number(entry.longitude).toFixed(6) : "-",
      "GPS Location":
        entry.latitude != null && entry.longitude != null
          ? `https://maps.google.com/?q=${Number(entry.latitude).toFixed(6)},${Number(entry.longitude).toFixed(6)}`
          : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ASM Expenses");
    XLSX.writeFile(wb, "ASM_Expenses_Report.xlsx");
  };

  return (
    <div data-ocid="rsm_team_reports.section">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Team Working Reports
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          View detailed working entries from MRs and ASMs
        </p>
      </div>

      <Tabs defaultValue="mr" data-ocid="rsm_team_reports.tab">
        <TabsList className="mb-4">
          <TabsTrigger value="mr">MR Working Reports</TabsTrigger>
          <TabsTrigger value="asm">ASM Working Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="mr">
          <Tabs defaultValue="detailing">
            <TabsList className="mb-4">
              <TabsTrigger value="detailing">Detailing Visits</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="overview">Working Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="detailing">
              <Card className="border border-[#E5EAF2] shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    MR Detailing Visits
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportMrDetailing}
                    className="gap-2 text-xs h-8"
                  >
                    <Download size={14} /> Export Excel
                  </Button>
                </CardHeader>
                <CardContent>
                  <DateFilter
                    fromDate={mrDetailFrom}
                    toDate={mrDetailTo}
                    onFromChange={setMrDetailFrom}
                    onToChange={setMrDetailTo}
                    onClear={() => {
                      setMrDetailFrom("");
                      setMrDetailTo("");
                    }}
                  />
                  {loadingDetailing ? (
                    <div
                      className="space-y-2"
                      data-ocid="rsm_team_reports.loading_state"
                    >
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : filteredMrDetailingRows.length === 0 ? (
                    <div
                      className="text-center py-10"
                      data-ocid="rsm_team_reports.empty_state"
                    >
                      <p className="text-gray-400 text-sm">
                        No detailing entries found.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="overflow-x-auto"
                      data-ocid="rsm_team_reports.table"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>MR Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Products Detailed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMrDetailingRows.map(
                            ({ pStr, entry, rowKey }, idx) => (
                              <TableRow
                                key={rowKey}
                                data-ocid={`rsm_team_reports.row.${idx + 1}`}
                              >
                                <TableCell className="text-gray-500 text-sm">
                                  {idx + 1}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-700 text-xs"
                                  >
                                    {getUserName(pStr)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-700">
                                  {entry.date}
                                </TableCell>
                                <TableCell className="text-sm text-gray-700">
                                  {getDoctorName(entry.doctorId)}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 max-w-[200px]">
                                  {getProductNames(entry.productIds)}
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses">
              <Card className="border border-[#E5EAF2] shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    MR Expense Entries
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportMrExpenses}
                    className="gap-2 text-xs h-8"
                  >
                    <Download size={14} /> Export Excel
                  </Button>
                </CardHeader>
                <CardContent>
                  <DateFilter
                    fromDate={mrExpFrom}
                    toDate={mrExpTo}
                    onFromChange={setMrExpFrom}
                    onToChange={setMrExpTo}
                    onClear={() => {
                      setMrExpFrom("");
                      setMrExpTo("");
                    }}
                  />
                  {loadingExpenses ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : filteredMrExpenseRows.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-400 text-sm">
                        No expense entries found.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>MR Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>KM</TableHead>
                            <TableHead>TA (₹)</TableHead>
                            <TableHead>DA (₹)</TableHead>
                            <TableHead>DA Type</TableHead>
                            <TableHead>Working Area</TableHead>
                            <TableHead>Total (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMrExpenseRows.map(
                            ({ pStr, entry, rowKey }, idx) => (
                              <TableRow key={rowKey}>
                                <TableCell className="text-gray-500 text-sm">
                                  {idx + 1}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-700 text-xs"
                                  >
                                    {getUserName(pStr)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-700">
                                  {entry.date}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {Number(entry.kmTraveled)} km
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {Number(entry.taAmount).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {Number(entry.daAmount).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {daTypeBadge(entry.daType)}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {entry.workingArea || "-"}
                                </TableCell>
                                <TableCell className="text-sm font-semibold text-gray-800">
                                  {(
                                    Number(entry.taAmount) +
                                    Number(entry.daAmount)
                                  ).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview">
              <MRWorkingOverview
                mrPrincipalSet={mrPrincipalSet}
                teamDetailing={teamDetailing as Array<[any, any[]]>}
                teamExpenses={teamExpenses as Array<[any, any[]]>}
                getUserName={getUserName}
                getDoctorName={getDoctorName}
                getProductNames={getProductNames}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="asm">
          <Card className="border border-[#E5EAF2] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800">
                ASM Working Detail Submissions
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAsmExpenses}
                className="gap-2 text-xs h-8"
              >
                <Download size={14} /> Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <DateFilter
                fromDate={asmFrom}
                toDate={asmTo}
                onFromChange={setAsmFrom}
                onToChange={setAsmTo}
                onClear={() => {
                  setAsmFrom("");
                  setAsmTo("");
                }}
              />
              {loadingExpenses ? (
                <div
                  className="space-y-2"
                  data-ocid="rsm_team_reports.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filteredAsmExpenseRows.length === 0 ? (
                <div
                  className="text-center py-10"
                  data-ocid="rsm_team_reports.empty_state"
                >
                  <p className="text-gray-400 text-sm">
                    No ASM working detail submissions found.
                  </p>
                </div>
              ) : (
                <div
                  className="overflow-x-auto"
                  data-ocid="rsm_team_reports.table"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>ASM Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>KM</TableHead>
                        <TableHead>TA (₹)</TableHead>
                        <TableHead>DA (₹)</TableHead>
                        <TableHead>DA Type</TableHead>
                        <TableHead>Working Area</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAsmExpenseRows.map(
                        ({ pStr, entry, rowKey }, idx) => (
                          <TableRow
                            key={rowKey}
                            data-ocid={`rsm_team_reports.row.${idx + 1}`}
                          >
                            <TableCell className="text-gray-500 text-sm">
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="bg-indigo-50 text-indigo-700 text-xs"
                              >
                                {getUserName(pStr)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">
                              {entry.date}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {Number(entry.kmTraveled)} km
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {Number(entry.taAmount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {Number(entry.daAmount).toFixed(2)}
                            </TableCell>
                            <TableCell>{daTypeBadge(entry.daType)}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {entry.workingArea || "-"}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500 max-w-[160px] truncate">
                              {entry.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

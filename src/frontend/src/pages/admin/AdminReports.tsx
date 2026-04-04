import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { useActor } from "../../hooks/useActor";
import { loadXlsx } from "../../lib/xlsxLoader";

async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
) {
  const XLSX = await loadXlsx();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function ReportCard({
  title,
  description,
  count,
  isLoading,
  onExport,
  exportId,
}: {
  title: string;
  description: string;
  count: number;
  isLoading: boolean;
  onExport: () => void;
  exportId: string;
}) {
  return (
    <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
      <CardHeader className="border-b border-[#F1F5F9] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                {title}
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="w-20 h-6 rounded-full" />
          ) : (
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
              {count} records
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <div
            data-ocid={`reports.${exportId}.loading_state`}
            className="space-y-2"
          >
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
        ) : (
          <Button
            data-ocid={`reports.${exportId}.button`}
            className="bg-green-600 hover:bg-green-700 text-white w-full"
            onClick={onExport}
            disabled={count === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export .xlsx{count === 0 ? " (No data)" : ""}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminReports() {
  const { actor, isFetching } = useActor();
  const enabled = !!actor && !isFetching;

  const { data: mrProfiles = [], isLoading: loadingMR } = useQuery({
    queryKey: ["all-mr-profiles"],
    queryFn: () => actor!.getAllMRProfiles(),
    enabled,
  });

  const { data: userProfiles = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["all-user-profiles"],
    queryFn: () => actor!.getAllUserProfiles(),
    enabled,
  });

  const { data: leaveApps = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ["all-leave-applications"],
    queryFn: () => actor!.getAllLeaveApplications(),
    enabled,
  });

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: () => actor!.getAllDoctors(),
    enabled,
  });

  const { data: areas = [], isLoading: loadingAreas } = useQuery({
    queryKey: ["all-areas"],
    queryFn: () => actor!.getAllAreas(),
    enabled,
  });

  const { data: teamDetailings = [], isLoading: loadingDetailings } = useQuery({
    queryKey: ["team-detailing-entries"],
    queryFn: () => actor!.getTeamDetailingEntries(),
    enabled,
  });

  const { data: allProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["all-products"],
    queryFn: () => actor!.getAllProducts(),
    enabled,
  });

  const { data: teamExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["team-expense-entries"],
    queryFn: () => actor!.getTeamExpenseEntries(),
    enabled,
  });

  const { data: crmDemands = [], isLoading: loadingCRM } = useQuery({
    queryKey: ["all-crm-demands"],
    queryFn: () => actor!.getAllCRMDemands(),
    enabled,
  });

  const { data: giftDistributions = [], isLoading: loadingGiftDist } = useQuery(
    {
      queryKey: ["all-gift-distributions"],
      queryFn: () => actor!.getAllGiftDistributions(),
      enabled,
    },
  );

  const { data: chemistOrders = [], isLoading: loadingChemistOrders } =
    useQuery({
      queryKey: ["all-chemist-orders"],
      queryFn: () => actor!.getChemistOrders(),
      enabled,
    });

  const { data: allChemistsReport = [], isLoading: loadingChemistsReport } =
    useQuery({
      queryKey: ["all-chemists-report"],
      queryFn: () => actor!.getAllChemists(),
      enabled,
    });

  // Build lookup maps
  const userMap = new Map(userProfiles.map(([p, u]) => [p.toString(), u]));
  const areaMap = new Map(areas.map((a) => [String(a.id), a.name]));
  const productMap = new Map(allProducts.map((p) => [String(p.id), p.name]));
  const doctorMap = new Map(doctors.map((d) => [String(d.id), d.name]));

  const exportMRProfiles = () => {
    const data = mrProfiles.map(([principal, mrp]) => ({
      "Employee Code": mrp.employeeCode,
      Name: userMap.get(principal.toString())?.name ?? "N/A",
      Headquarter: mrp.headQuarter,
      "Principal ID": `${principal.toString().slice(0, 12)}...`,
      "Assigned Areas": mrp.assignedAreas.length,
    }));
    exportToExcel(data, "MR_Profiles_Report");
  };

  const leaveRows = leaveApps.flatMap(([principal, leaves]) =>
    leaves.map((l) => ({
      "Employee Name": userMap.get(principal.toString())?.name ?? "N/A",
      "Leave Type": String(l.leaveType),
      "From Date": l.fromDate,
      "To Date": l.toDate,
      Days: Number(l.days),
      Reason: l.reason,
      Status: String(l.status),
    })),
  );
  const exportLeaves = () =>
    exportToExcel(leaveRows, "Leave_Applications_Report");

  const exportDoctors = () => {
    const data = doctors.map((d) => ({
      "Doctor Name": d.name,
      Qualification: d.qualification,
      Station: d.station,
      Specialization: d.specialization,
      Area: areaMap.get(String(d.areaId)) ?? "N/A",
    }));
    exportToExcel(data, "Doctor_List_Report");
  };

  const detailingRows = teamDetailings.flatMap(([principal, entries]) =>
    entries.map((e) => ({
      "MR Name": userMap.get(principal.toString())?.name ?? "N/A",
      "Doctor Name": doctorMap.get(String(e.doctorId)) ?? "N/A",
      Date: e.date,
      "Products Detailed": e.productIds
        .map((id) => productMap.get(String(id)) ?? String(id))
        .join(", "),
    })),
  );
  const exportDetailings = () =>
    exportToExcel(detailingRows, "Team_Detailing_Report");

  const expenseRows = teamExpenses.flatMap(([principal, entries]) =>
    entries.map((e) => ({
      "Staff Name": userMap.get(principal.toString())?.name ?? "N/A",
      Date: e.date,
      "KM Traveled": Number(e.kmTraveled),
      "DA Type": e.daType || "-",
      "Working Area": e.workingArea || "-",
      "TA Amount": Number(e.taAmount),
      "DA Amount": Number(e.daAmount),
      Total: Number(e.taAmount) + Number(e.daAmount),
      Notes: e.notes,
      "GPS Latitude": e.latitude != null ? Number(e.latitude).toFixed(6) : "-",
      "GPS Longitude":
        e.longitude != null ? Number(e.longitude).toFixed(6) : "-",
      "GPS Location":
        e.latitude != null && e.longitude != null
          ? `https://maps.google.com/?q=${Number(e.latitude).toFixed(6)},${Number(e.longitude).toFixed(6)}`
          : "-",
    })),
  );
  const exportExpenses = () =>
    exportToExcel(expenseRows, "Team_Expense_Report");

  const crmRows = crmDemands.map((d) => ({
    "Raised By": d.raiserName,
    "Doctor Name": d.doctorName,
    "Amount (\u20b9)": Number(d.amount),
    Date: d.date,
    Notes: d.notes || "",
    Status: String(d.status),
    "Admin Remarks": d.adminRemarks || "",
  }));
  const exportCRM = () => exportToExcel(crmRows, "CRM_Demands_Report");

  const giftDistRows = giftDistributions.map((g) => ({
    "Distributed By": `${g.distributedBy.toString().slice(0, 8)}...`,
    "Doctor Name": g.doctorName,
    "Gift Article": g.giftArticleName,
    Quantity: Number(g.quantity),
    Date: g.date,
  }));
  const exportGiftDist = () =>
    exportToExcel(giftDistRows, "Gift_Distribution_Report");

  const chemistMap = new Map(
    allChemistsReport.map((c) => [String(c.id), c.name]),
  );
  const chemistOrderRows = chemistOrders.map((o) => ({
    "Chemist Name": chemistMap.get(String(o.chemistId)) ?? "N/A",
    Product: productMap.get(String(o.productId)) ?? "N/A",
    Date: o.date,
    Quantity: Number(o.quantity),
    Scheme: o.scheme,
    Status: String(o.status),
  }));
  const exportChemistOrders = () =>
    exportToExcel(chemistOrderRows, "Chemist_Call_Orders_Report");

  const isLoadingMRCard = loadingMR || loadingUsers;
  const isLoadingLeaveCard = loadingLeaves || loadingUsers;
  const isLoadingDetailingCard =
    loadingDetailings || loadingUsers || loadingDoctors || loadingProducts;
  const isLoadingExpenseCard = loadingExpenses || loadingUsers;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Export Reports</h2>
          <p className="text-sm text-gray-400">
            Download reports as Excel (.xlsx) files
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <ReportCard
          title="MR Profiles Report"
          description="Employee codes, HQ, and area assignments"
          count={mrProfiles.length}
          isLoading={isLoadingMRCard}
          onExport={exportMRProfiles}
          exportId="mr_profiles"
        />
        <ReportCard
          title="Leave Applications Report"
          description="All leave requests with status"
          count={leaveRows.length}
          isLoading={isLoadingLeaveCard}
          onExport={exportLeaves}
          exportId="leaves"
        />
        <ReportCard
          title="Doctor List Report"
          description="All doctors with area and specialization"
          count={doctors.length}
          isLoading={loadingDoctors || loadingAreas}
          onExport={exportDoctors}
          exportId="doctors"
        />
        <ReportCard
          title="Team Detailing Report"
          description="Doctor visits and product detailing by MRs"
          count={detailingRows.length}
          isLoading={isLoadingDetailingCard}
          onExport={exportDetailings}
          exportId="detailing"
        />
        <ReportCard
          title="Team Expense Report"
          description="TA/DA expense entries for all MRs"
          count={expenseRows.length}
          isLoading={isLoadingExpenseCard}
          onExport={exportExpenses}
          exportId="expenses"
        />
        <ReportCard
          title="CRM Demand Report"
          description="All CRM demands by ASM & RSM with approval status"
          count={crmRows.length}
          isLoading={loadingCRM}
          onExport={exportCRM}
          exportId="crm_demands"
        />
        <ReportCard
          title="Gift Distribution Report"
          description="All gift articles distributed to doctors by MRs"
          count={giftDistRows.length}
          isLoading={loadingGiftDist}
          onExport={exportGiftDist}
          exportId="gift_distributions"
        />
        <ReportCard
          title="Chemist Orders Report"
          description="All chemist call orders by MRs"
          count={chemistOrderRows.length}
          isLoading={
            loadingChemistOrders || loadingChemistsReport || loadingProducts
          }
          onExport={exportChemistOrders}
          exportId="chemist_orders"
        />
      </div>
    </div>
  );
}

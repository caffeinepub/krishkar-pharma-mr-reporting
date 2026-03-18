import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";

export default function RSMTeamReports() {
  const { actor, isFetching } = useActor();

  const { data: teamDetailing = [], isLoading: loadingDetailing } = useQuery({
    queryKey: ["rsm", "teamDetailing"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTeamDetailingEntries();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: teamExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["rsm", "teamExpenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTeamExpenseEntries();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allUserProfiles = [] } = useQuery({
    queryKey: ["rsm", "allUserProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allManagerProfiles = [] } = useQuery({
    queryKey: ["rsm", "allManagerProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllManagerProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const profileMap = new Map<string, string>();
  for (const [p, profile] of allUserProfiles as Array<[any, any]>) {
    profileMap.set(p.toString(), profile.name);
  }
  for (const [p, profile] of allManagerProfiles as Array<[any, any]>) {
    if (!profileMap.has(p.toString())) {
      profileMap.set(
        p.toString(),
        profile.name || `${p.toString().slice(0, 8)}...`,
      );
    }
  }

  const getUserName = (principalStr: string) => {
    const name = profileMap.get(principalStr);
    return name || `${principalStr.slice(0, 8)}...`;
  };

  const detailingRows = (teamDetailing as Array<[any, any[]]>).flatMap(
    ([principal, entries]) =>
      entries.map((entry: any) => ({
        pStr: principal.toString(),
        entry,
        rowKey: `${principal.toString()}-${entry.date}-${entry.doctorId}`,
      })),
  );

  const expenseRows = (teamExpenses as Array<[any, any[]]>).flatMap(
    ([principal, entries]) =>
      entries.map((entry: any) => ({
        pStr: principal.toString(),
        entry,
        rowKey: `${principal.toString()}-${entry.date}-${entry.kmTraveled}`,
      })),
  );

  return (
    <div data-ocid="rsm_team_reports.section">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Team Reports</h2>
        <p className="text-sm text-gray-500 mt-1">
          View detailing and expense entries from your team
        </p>
      </div>

      <Tabs defaultValue="detailing" data-ocid="rsm_team_reports.tab">
        <TabsList className="mb-4">
          <TabsTrigger value="detailing">Detailing Visits</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="detailing">
          <Card className="border border-[#E5EAF2] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-800">
                Team Detailing Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDetailing ? (
                <div
                  className="space-y-2"
                  data-ocid="rsm_team_reports.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : detailingRows.length === 0 ? (
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
                        <TableHead>Member</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Products</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailingRows.map(({ pStr, entry, rowKey }, rowIdx) => (
                        <TableRow
                          key={rowKey}
                          data-ocid={`rsm_team_reports.row.${rowIdx + 1}`}
                        >
                          <TableCell className="text-gray-500 text-sm">
                            {rowIdx + 1}
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
                            {entry.productIds.length} product
                            {entry.productIds.length !== 1 ? "s" : ""}
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

        <TabsContent value="expenses">
          <Card className="border border-[#E5EAF2] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-800">
                Team Expense Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : expenseRows.length === 0 ? (
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
                        <TableHead>Member</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>KM</TableHead>
                        <TableHead>TA</TableHead>
                        <TableHead>DA</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseRows.map(({ pStr, entry, rowKey }, rowIdx) => (
                        <TableRow key={rowKey}>
                          <TableCell className="text-gray-500 text-sm">
                            {rowIdx + 1}
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
                            ₹{Number(entry.taAmount)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            ₹{Number(entry.daAmount)}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-gray-800">
                            ₹{Number(entry.taAmount) + Number(entry.daAmount)}
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
    </div>
  );
}

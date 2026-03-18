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
import { useQuery } from "@tanstack/react-query";
import { useActor } from "../../hooks/useActor";

export default function MRManagement() {
  const { actor, isFetching } = useActor();

  const { data: mrProfiles, isLoading } = useQuery({
    queryKey: ["admin", "mrProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMRProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  return (
    <div data-ocid="mr_management.section">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">MR Management</h2>
        <p className="text-sm text-gray-500 mt-1">
          All registered Medical Representatives
        </p>
      </div>

      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">
            Registered MRs ({isLoading ? "..." : (mrProfiles?.length ?? 0)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" data-ocid="mr_management.loading_state">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : mrProfiles?.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="mr_management.empty_state"
            >
              <p className="text-gray-400 text-sm">
                No MR profiles registered yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="mr_management.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Head Quarter</TableHead>
                    <TableHead>Assigned Areas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrProfiles?.map(([principal, profile], idx) => {
                    const p = principal.toString();
                    const short = `${p.slice(0, 10)}...${p.slice(-6)}`;
                    return (
                      <TableRow
                        key={p}
                        data-ocid={`mr_management.row.${idx + 1}`}
                      >
                        <TableCell className="text-gray-500 text-sm">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {short}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium text-gray-800">
                          {profile.employeeCode}
                        </TableCell>
                        <TableCell>
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                            {profile.headQuarter}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-600 text-sm">
                            {profile.assignedAreas.length} area
                            {profile.assignedAreas.length !== 1 ? "s" : ""}
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
    </div>
  );
}

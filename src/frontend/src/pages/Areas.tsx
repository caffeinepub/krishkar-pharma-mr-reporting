import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, MapPin } from "lucide-react";
import type { Area, Headquarter, MRProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

export default function Areas() {
  const { actor, isFetching } = useActor();

  const enabled = !!actor && !isFetching;

  const { data: allAreas = [], isLoading: loadingAreas } = useQuery<Area[]>({
    queryKey: ["areas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAreas();
    },
    enabled,
  });

  const { data: headquarters = [], isLoading: loadingHQ } = useQuery<
    Headquarter[]
  >({
    queryKey: ["headquarters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllHeadquarters();
    },
    enabled,
  });

  const { data: mrProfile, isLoading: loadingProfile } = useQuery<MRProfile>({
    queryKey: ["mr-profile"],
    queryFn: () => actor!.getMRProfile(),
    enabled,
  });

  const assignedAreaIds = new Set(
    (mrProfile?.assignedAreas ?? []).map((id) => String(id)),
  );

  const areas = allAreas.filter((a) => assignedAreaIds.has(String(a.id)));

  const hqMap = new Map(headquarters.map((h) => [h.id.toString(), h.name]));

  const isLoading = loadingAreas || loadingHQ || loadingProfile;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          My Allotted Areas
        </h2>
        <p className="text-sm text-gray-500">
          {areas.length} area{areas.length !== 1 ? "s" : ""} assigned to you
        </p>
      </div>

      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-gray-700">
              Allotted Areas
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex justify-center py-12"
              data-ocid="areas.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : areas.length === 0 ? (
            <div data-ocid="areas.empty_state" className="text-center py-12">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No areas assigned yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Contact your Admin or RSM to get areas allotted
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC]">
                    <TableHead className="text-xs font-semibold text-gray-500 w-16">
                      #
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Area Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Headquarter
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Area ID
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map((area, idx) => (
                    <TableRow
                      key={String(area.id)}
                      data-ocid={`areas.item.${idx + 1}`}
                      className="hover:bg-[#F8FAFC]"
                    >
                      <TableCell className="text-xs text-gray-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                            <MapPin className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {area.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {hqMap.get(area.headquarterId.toString()) ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        #{String(area.id)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Area, Headquarter } from "../backend.d";
import { useActor } from "../hooks/useActor";

export default function Areas() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [newAreaName, setNewAreaName] = useState("");
  const [selectedHQId, setSelectedHQId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: areas = [], isLoading: loadingAreas } = useQuery<Area[]>({
    queryKey: ["areas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: headquarters = [], isLoading: loadingHQ } = useQuery<
    Headquarter[]
  >({
    queryKey: ["headquarters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllHeadquarters();
    },
    enabled: !!actor && !isFetching,
  });

  const hqMap = new Map(headquarters.map((h) => [h.id.toString(), h.name]));

  const addAreaMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addArea(newAreaName.trim(), BigInt(selectedHQId));
    },
    onSuccess: () => {
      toast.success("Area added successfully");
      setNewAreaName("");
      setSelectedHQId("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    },
    onError: () => toast.error("Failed to add area"),
  });

  const isLoading = loadingAreas || loadingHQ;
  const canSubmit = newAreaName.trim() && selectedHQId;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Area Management
          </h2>
          <p className="text-sm text-gray-500">
            {areas.length} areas configured
          </p>
        </div>
        <Button
          data-ocid="areas.open_modal_button"
          className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4" /> Add Area
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">New Area</p>
            {headquarters.length === 0 && !loadingHQ ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                Please add a Headquarter first from Admin Portal before creating
                an area.
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="hq-select"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Select Headquarter <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedHQId} onValueChange={setSelectedHQId}>
                    <SelectTrigger
                      id="hq-select"
                      data-ocid="areas.select"
                      className="border-[#E5EAF2]"
                    >
                      <SelectValue placeholder="Choose a headquarter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headquarters.map((hq) => (
                        <SelectItem
                          key={hq.id.toString()}
                          value={hq.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            {hq.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="area-name"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Area Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="area-name"
                      data-ocid="areas.input"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      placeholder="Enter area name (e.g. Sector 12)"
                      className="border-[#E5EAF2] flex-1"
                      disabled={!selectedHQId}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canSubmit)
                          addAreaMutation.mutate();
                      }}
                    />
                    <Button
                      data-ocid="areas.submit_button"
                      className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                      onClick={() => addAreaMutation.mutate()}
                      disabled={addAreaMutation.isPending || !canSubmit}
                    >
                      {addAreaMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-gray-700">
              All Areas
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
              <p className="text-gray-500 font-medium">No areas added yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Add your first area to get started
              </p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

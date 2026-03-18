import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { FlaskConical, Loader2, Plus, Stethoscope } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Area, Doctor, Product } from "../backend";
import { useActor } from "../hooks/useActor";

export default function Doctors() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [filterAreaId, setFilterAreaId] = useState<string>("all");
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showDetailing, setShowDetailing] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [dName, setDName] = useState("");
  const [dQual, setDQual] = useState("");
  const [dStation, setDStation] = useState("");
  const [dSpec, setDSpec] = useState("");
  const [dAreaId, setDAreaId] = useState("");

  const [detailDate, setDetailDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );

  const [sampleDate, setSampleDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [sampleProductId, setSampleProductId] = useState("");
  const [sampleQty, setSampleQty] = useState("1");

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["areas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allDoctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["doctors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDoctors();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });

  const filteredDoctors =
    filterAreaId === "all"
      ? allDoctors
      : allDoctors.filter((d) => String(d.areaId) === filterAreaId);

  const addDoctorMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addDoctor(dName, dQual, dStation, dSpec, BigInt(dAreaId));
    },
    onSuccess: () => {
      toast.success("Doctor added");
      setShowAddDoctor(false);
      setDName("");
      setDQual("");
      setDStation("");
      setDSpec("");
      setDAreaId("");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: () => toast.error("Failed to add doctor"),
  });

  const detailingMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !selectedDoctor) throw new Error("No actor");
      const productIds = Array.from(selectedProductIds).map((id) => BigInt(id));
      await actor.logDetailing(selectedDoctor.id, detailDate, productIds);
    },
    onSuccess: () => {
      toast.success("Detailing logged");
      setShowDetailing(false);
      setSelectedProductIds(new Set());
    },
    onError: () => toast.error("Failed to log detailing"),
  });

  const sampleMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !selectedDoctor) throw new Error("No actor");
      await actor.logSample(
        selectedDoctor.id,
        sampleDate,
        BigInt(sampleProductId),
        BigInt(sampleQty),
      );
    },
    onSuccess: () => {
      toast.success("Sample logged");
      setShowSample(false);
      setSampleProductId("");
      setSampleQty("1");
    },
    onError: () => toast.error("Failed to log sample"),
  });

  const getAreaName = (areaId: bigint) =>
    areas.find((a) => a.id === areaId)?.name ?? String(areaId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Doctor Management
          </h2>
          <p className="text-sm text-gray-500">
            {filteredDoctors.length} doctors found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterAreaId} onValueChange={setFilterAreaId}>
            <SelectTrigger
              data-ocid="doctors.select"
              className="w-44 border-[#E5EAF2] text-sm"
            >
              <SelectValue placeholder="Filter by area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={String(a.id)} value={String(a.id)}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            data-ocid="doctors.open_modal_button"
            className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
            onClick={() => setShowAddDoctor(true)}
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </Button>
        </div>
      </div>

      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex justify-center py-12"
              data-ocid="doctors.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div data-ocid="doctors.empty_state" className="text-center py-12">
              <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No doctors found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC]">
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Doctor
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Qualification
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Station
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Specialization
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Area
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doc, idx) => (
                  <TableRow
                    key={String(doc.id)}
                    data-ocid={`doctors.item.${idx + 1}`}
                    className="hover:bg-[#F8FAFC]"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">
                          {doc.name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Dr. {doc.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {doc.qualification}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {doc.station}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {doc.specialization}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {getAreaName(doc.areaId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          data-ocid={`doctors.detail.button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedDoctor(doc);
                            setShowDetailing(true);
                          }}
                        >
                          Detail
                        </Button>
                        <Button
                          data-ocid={`doctors.sample.button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2 border-teal-200 text-teal-600 hover:bg-teal-50"
                          onClick={() => {
                            setSelectedDoctor(doc);
                            setShowSample(true);
                          }}
                        >
                          <FlaskConical className="w-3 h-3 mr-1" /> Sample
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Doctor Dialog */}
      <Dialog open={showAddDoctor} onOpenChange={setShowAddDoctor}>
        <DialogContent className="sm:max-w-md" data-ocid="doctors.dialog">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Add New Doctor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Full Name
                </Label>
                <Input
                  data-ocid="doctors.name.input"
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  placeholder="Dr. Ramesh Sharma"
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Qualification
                </Label>
                <Input
                  data-ocid="doctors.qual.input"
                  value={dQual}
                  onChange={(e) => setDQual(e.target.value)}
                  placeholder="MBBS, MD"
                  className="border-[#E5EAF2]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Station / Location
                </Label>
                <Input
                  data-ocid="doctors.station.input"
                  value={dStation}
                  onChange={(e) => setDStation(e.target.value)}
                  placeholder="Sector 12"
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Specialization
                </Label>
                <Input
                  data-ocid="doctors.spec.input"
                  value={dSpec}
                  onChange={(e) => setDSpec(e.target.value)}
                  placeholder="Cardiologist"
                  className="border-[#E5EAF2]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Area</Label>
              <Select value={dAreaId} onValueChange={setDAreaId}>
                <SelectTrigger
                  data-ocid="doctors.area.select"
                  className="border-[#E5EAF2]"
                >
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={String(a.id)} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                data-ocid="doctors.submit_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={() => addDoctorMutation.mutate()}
                disabled={addDoctorMutation.isPending || !dName || !dAreaId}
              >
                {addDoctorMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Doctor"
                )}
              </Button>
              <Button
                variant="outline"
                data-ocid="doctors.cancel_button"
                onClick={() => setShowAddDoctor(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailing Dialog */}
      <Dialog open={showDetailing} onOpenChange={setShowDetailing}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="doctors.detail.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Log Detailing — Dr. {selectedDoctor?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Date</Label>
              <Input
                type="date"
                data-ocid="doctors.detail.date.input"
                value={detailDate}
                onChange={(e) => setDetailDate(e.target.value)}
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                Products Detailed
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {products.map((p) => (
                  <div
                    key={String(p.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2]"
                  >
                    <Checkbox
                      id={`dp-${p.id}`}
                      data-ocid="doctors.product.checkbox"
                      checked={selectedProductIds.has(String(p.id))}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedProductIds);
                        if (checked) next.add(String(p.id));
                        else next.delete(String(p.id));
                        setSelectedProductIds(next);
                      }}
                    />
                    <label
                      htmlFor={`dp-${p.id}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {p.code} — {p.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                data-ocid="doctors.detail.submit_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={() => detailingMutation.mutate()}
                disabled={
                  detailingMutation.isPending || selectedProductIds.size === 0
                }
              >
                {detailingMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Log Detailing"
                )}
              </Button>
              <Button
                variant="outline"
                data-ocid="doctors.detail.cancel_button"
                onClick={() => setShowDetailing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sample Dialog */}
      <Dialog open={showSample} onOpenChange={setShowSample}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="doctors.sample.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Give Sample — Dr. {selectedDoctor?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Date</Label>
              <Input
                type="date"
                data-ocid="doctors.sample.date.input"
                value={sampleDate}
                onChange={(e) => setSampleDate(e.target.value)}
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                Product
              </Label>
              <Select
                value={sampleProductId}
                onValueChange={setSampleProductId}
              >
                <SelectTrigger
                  data-ocid="doctors.sample.select"
                  className="border-[#E5EAF2]"
                >
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                Quantity
              </Label>
              <Input
                type="number"
                min="1"
                data-ocid="doctors.sample.qty.input"
                value={sampleQty}
                onChange={(e) => setSampleQty(e.target.value)}
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="flex gap-3">
              <Button
                data-ocid="doctors.sample.submit_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={() => sampleMutation.mutate()}
                disabled={sampleMutation.isPending || !sampleProductId}
              >
                {sampleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Log Sample"
                )}
              </Button>
              <Button
                variant="outline"
                data-ocid="doctors.sample.cancel_button"
                onClick={() => setShowSample(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

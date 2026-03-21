import { Badge } from "@/components/ui/badge";
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
import {
  Car,
  ClipboardList,
  IndianRupee,
  Loader2,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Area, ExpenseEntry, TADASettingsV3 } from "../../backend";
import { useActor } from "../../hooks/useActor";

const TA_SCALE = 100;

function formatTA(stored: bigint | number): string {
  const n = Number(stored);
  if (n === 0) return "0.00";
  return (n / TA_SCALE).toFixed(2);
}

type DaType = "HQ" | "OutStation" | "ExStation";

function getDaBadgeClass(daType: DaType | string) {
  if (daType === "HQ") return "text-blue-600 border-blue-300 bg-blue-50";
  if (daType === "ExStation")
    return "text-green-600 border-green-300 bg-green-50";
  return "text-orange-600 border-orange-300 bg-orange-50";
}

function getDaLabel(daType: DaType | string) {
  if (daType === "HQ") return "Head Quarter";
  if (daType === "ExStation") return "Ex-Station";
  return "Out Station";
}

export default function ASMWorkingDetails() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [workingArea, setWorkingArea] = useState("");
  const [doctorsVisited, setDoctorsVisited] = useState("");
  const [km, setKm] = useState("");
  const [daType, setDaType] = useState<DaType>("HQ");
  const [da, setDa] = useState("300");
  const [daOverride, setDaOverride] = useState(false);
  const [taManual, setTaManual] = useState("");
  const [taOverride, setTaOverride] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: tadaSettings } = useQuery<TADASettingsV3>({
    queryKey: ["tadaSettings"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.adminGetTADASettings();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["assignedAreas"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getAllAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: expenseHistory = [] } = useQuery<ExpenseEntry[]>({
    queryKey: ["asmExpenseHistory"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getExpenseEntries();
    },
    enabled: !!actor && !isFetching,
  });

  const asmDaHQ = tadaSettings ? Number(tadaSettings.asmDaHQ) : 300;
  const asmDaOut = tadaSettings ? Number(tadaSettings.asmDaOutStation) : 400;
  const asmDaEx = tadaSettings
    ? Number(tadaSettings.asmDaExStation ?? 600n)
    : 600;
  const asmTaRateRaw = tadaSettings ? Number(tadaSettings.asmTaPerKm) : 275;
  const asmTaRate = asmTaRateRaw / TA_SCALE;

  const computedTA = (() => {
    const k = Number.parseFloat(km) || 0;
    return (k * asmTaRate).toFixed(2);
  })();

  const displayTA = taOverride ? taManual : computedTA;

  useEffect(() => {
    if (!daOverride) {
      if (daType === "HQ") setDa(String(asmDaHQ));
      else if (daType === "ExStation") setDa(String(asmDaEx));
      else setDa(String(asmDaOut));
    }
  }, [daType, asmDaHQ, asmDaOut, asmDaEx, daOverride]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const kmVal = Math.round((Number.parseFloat(km) || 0) * 10);
      const daVal = Number.parseInt(da) || 0;
      const taVal = Math.round((Number.parseFloat(displayTA) || 0) * TA_SCALE);
      const visitCount = Number.parseInt(doctorsVisited) || 0;
      const combinedNotes =
        visitCount > 0
          ? `Doctors Visited: ${visitCount}${notes ? ` | ${notes}` : ""}`
          : notes;
      await actor.addExpense(
        date,
        BigInt(kmVal),
        BigInt(daVal),
        combinedNotes,
        BigInt(taVal),
        workingArea,
        daType,
      );
    },
    onSuccess: () => {
      toast.success("Working details submitted successfully");
      setKm("");
      setDoctorsVisited("");
      setNotes("");
      setTaManual("");
      setTaOverride(false);
      setDaOverride(false);
      queryClient.invalidateQueries({ queryKey: ["asmExpenseHistory"] });
    },
    onError: () => toast.error("Failed to submit working details"),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList size={18} className="text-purple-600" />
            Daily Working Details & TA/DA Demand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <MapPin size={13} /> Working Area
              </Label>
              <Select value={workingArea} onValueChange={setWorkingArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={String(a.id)} value={a.name}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Stethoscope size={13} /> No. of Doctors Visited
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 8"
                value={doctorsVisited}
                onChange={(e) => setDoctorsVisited(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Car size={13} /> KM Traveled
              </Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 45.5"
                value={km}
                onChange={(e) => {
                  setKm(e.target.value);
                  setTaOverride(false);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <IndianRupee size={13} /> TA Amount (₹)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Auto-calculated"
                  value={taOverride ? taManual : computedTA}
                  onChange={(e) => {
                    setTaManual(e.target.value);
                    setTaOverride(true);
                  }}
                />
                {taOverride && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTaOverride(false);
                      setTaManual("");
                    }}
                  >
                    Auto
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Rate: ₹{asmTaRate.toFixed(2)}/km
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>DA Type</Label>
              <Select
                value={daType}
                onValueChange={(v) => {
                  setDaType(v as DaType);
                  setDaOverride(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HQ">Head Quarter</SelectItem>
                  <SelectItem value="OutStation">Out Station</SelectItem>
                  <SelectItem value="ExStation">Ex-Station</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <IndianRupee size={13} /> DA Amount (₹)
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={da}
                  onChange={(e) => {
                    setDa(e.target.value);
                    setDaOverride(true);
                  }}
                />
                <Badge variant="outline" className={getDaBadgeClass(daType)}>
                  {getDaLabel(daType)}
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-bold text-gray-900">
                ₹
                {(
                  (Number.parseFloat(displayTA) || 0) +
                  (Number.parseInt(da) || 0)
                ).toFixed(2)}
              </span>
              <span className="text-gray-400 ml-2">(TA + DA)</span>
            </div>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !workingArea || !date}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {mutation.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              Submit Working Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission History</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseHistory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No submissions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Doctors Visited</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>DA Type</TableHead>
                    <TableHead>TA (₹)</TableHead>
                    <TableHead>DA (₹)</TableHead>
                    <TableHead>Total (₹)</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...expenseHistory].reverse().map((e, i) => {
                    const notesText = e.notes || "";
                    const visitMatch = notesText.match(
                      /Doctors Visited: (\d+)/,
                    );
                    const visitCount = visitMatch ? visitMatch[1] : "-";
                    const cleanNotes = notesText
                      .replace(/Doctors Visited: \d+ ?\|? ?/, "")
                      .trim();
                    return (
                      <TableRow key={`${e.date}-${i}`}>
                        <TableCell className="whitespace-nowrap">
                          {e.date}
                        </TableCell>
                        <TableCell>{e.workingArea || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-purple-600 border-purple-300"
                          >
                            {visitCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(Number(e.kmTraveled) / 10).toFixed(1)}
                        </TableCell>
                        <TableCell>
                          {e.daType ? (
                            <Badge
                              variant="outline"
                              className={getDaBadgeClass(e.daType)}
                            >
                              {getDaLabel(e.daType)}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>₹{formatTA(e.taAmount)}</TableCell>
                        <TableCell>₹{String(e.daAmount)}</TableCell>
                        <TableCell>
                          ₹
                          {(
                            Number(e.taAmount) / TA_SCALE +
                            Number(e.daAmount)
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {cleanNotes || "-"}
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

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
import { Car, IndianRupee, Loader2, MapPin, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Area, ExpenseEntry, MRProfile, TADASettings } from "../backend";
import { useActor } from "../hooks/useActor";

// TA is stored as paise (x100) in the backend to preserve 2 decimal places
const TA_SCALE = 100;

function formatTA(stored: bigint | number): string {
  // stored value is in paise (x100). Values below 10000 are legacy integer rupees.
  const n = Number(stored);
  if (n === 0) return "0.00";
  // heuristic: if value > 10000 it's likely paise-scaled
  // but we always treat as paise since new entries are always scaled
  return (n / TA_SCALE).toFixed(2);
}

export default function Expenses() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [km, setKm] = useState("");
  const [da, setDa] = useState("300");
  const [daOverride, setDaOverride] = useState(false);
  const [notes, setNotes] = useState("");
  const [workingArea, setWorkingArea] = useState("");
  const [daType, setDaType] = useState<"HQ" | "OutStation">("HQ");
  const [taManual, setTaManual] = useState("");
  const [taOverride, setTaOverride] = useState(false);

  // Fetch TA/DA settings
  const { data: tadaSettings } = useQuery<TADASettings>({
    queryKey: ["tadaSettings"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.adminGetTADASettings();
    },
    enabled: !!actor && !isFetching,
  });

  // Fetch caller role to pick the right rate
  const { data: roleInfo } = useQuery({
    queryKey: ["callerRoleInfo"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getCallerRoleInfo();
    },
    enabled: !!actor && !isFetching,
  });

  const managerRole = roleInfo?.managerRole;
  const effectiveRole = managerRole || roleInfo?.baseRole || "mr";

  const taRateRaw = tadaSettings
    ? effectiveRole === "rsm"
      ? Number(tadaSettings.rsmTaPerKm)
      : effectiveRole === "asm"
        ? Number(tadaSettings.asmTaPerKm)
        : Number(tadaSettings.mrTaPerKm)
    : 275; // default 2.75 * 100
  const taRate = taRateRaw / TA_SCALE;

  const daHQAmount = tadaSettings
    ? effectiveRole === "rsm"
      ? Number(tadaSettings.rsmDaHQ)
      : effectiveRole === "asm"
        ? Number(tadaSettings.asmDaHQ)
        : Number(tadaSettings.mrDaHQ)
    : 300;

  const daOutAmount = tadaSettings
    ? effectiveRole === "rsm"
      ? Number(tadaSettings.rsmDaOutStation)
      : effectiveRole === "asm"
        ? Number(tadaSettings.asmDaOutStation)
        : Number(tadaSettings.mrDaOutStation)
    : 400;

  // Auto-calculate TA when KM changes (unless manually overridden)
  useEffect(() => {
    if (!taOverride && km) {
      const calculated = (Number.parseFloat(km) * taRate).toFixed(2);
      setTaManual(calculated);
    }
    if (!km && !taOverride) {
      setTaManual("");
    }
  }, [km, taOverride, taRate]);

  // Auto-set DA when daType changes (unless manually overridden)
  useEffect(() => {
    if (!daOverride) {
      setDa(daType === "HQ" ? String(daHQAmount) : String(daOutAmount));
    }
  }, [daType, daHQAmount, daOutAmount, daOverride]);

  const taValue = taManual ? Number.parseFloat(taManual) : 0;
  const total = taValue + Number(da);

  // Fetch user's MR profile to get assigned area IDs
  const { data: mrProfile } = useQuery<MRProfile>({
    queryKey: ["mrProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getMRProfile();
    },
    enabled: !!actor && !isFetching,
  });

  // Fetch all areas to resolve names from IDs
  const { data: allAreas = [] } = useQuery<Area[]>({
    queryKey: ["allAreas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAreas();
    },
    enabled: !!actor && !isFetching,
  });

  // Filter to only the MR's assigned areas
  const assignedAreas = mrProfile?.assignedAreas
    ? allAreas.filter((a) =>
        mrProfile.assignedAreas.some((id) => String(id) === String(a.id)),
      )
    : allAreas;

  const { data: expenses = [], isLoading } = useQuery<ExpenseEntry[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenseEntries();
    },
    enabled: !!actor && !isFetching,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const kmBig = BigInt(Math.round(Number.parseFloat(km)));
      const daBig = BigInt(Number(da));
      // Store TA as paise (x100) to preserve 2 decimal places
      const taPaise = taManual
        ? BigInt(Math.round(Number.parseFloat(taManual) * TA_SCALE))
        : null;
      await actor.addExpense(
        date,
        kmBig,
        daBig,
        notes,
        taPaise,
        workingArea,
        daType,
      );
    },
    onSuccess: () => {
      toast.success("Expense logged successfully");
      setKm("");
      setNotes("");
      setDaOverride(false);
      setWorkingArea("");
      setDaType("HQ");
      setTaManual("");
      setTaOverride(false);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => toast.error("Failed to log expense"),
  });

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                Log Daily Expense
              </CardTitle>
              <p className="text-xs text-gray-400">
                TA auto-calculated from settings · DA by HQ / Out Station type
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Date</Label>
              <Input
                type="date"
                data-ocid="expenses.date.input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                KM Traveled
              </Label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  data-ocid="expenses.km.input"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder="0.00"
                  className="pl-9 border-[#E5EAF2]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                TA Amount (₹){" "}
                <span className="text-gray-400 font-normal">
                  {taOverride ? "(manual)" : "(auto)"}
                </span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  data-ocid="expenses.ta.input"
                  value={taManual}
                  onChange={(e) => {
                    setTaOverride(true);
                    setTaManual(e.target.value);
                  }}
                  placeholder="Auto-calculated"
                  className={`pl-9 border-[#E5EAF2] ${taOverride ? "border-blue-400 bg-blue-50" : ""}`}
                />
              </div>
              {taOverride && (
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:underline"
                  onClick={() => {
                    setTaOverride(false);
                    if (km) {
                      setTaManual((Number.parseFloat(km) * taRate).toFixed(2));
                    } else {
                      setTaManual("");
                    }
                  }}
                >
                  Reset to auto-calculate
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                DA Amount (₹){" "}
                <span className="text-gray-400 font-normal">
                  {daOverride ? "(manual)" : "(auto)"}
                </span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  step="1"
                  data-ocid="expenses.da.input"
                  value={da}
                  onChange={(e) => {
                    setDaOverride(true);
                    setDa(e.target.value);
                  }}
                  className={`pl-9 border-[#E5EAF2] ${daOverride ? "border-blue-400 bg-blue-50" : ""}`}
                />
              </div>
              {daOverride && (
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:underline"
                  onClick={() => {
                    setDaOverride(false);
                    setDa(
                      daType === "HQ"
                        ? String(daHQAmount)
                        : String(daOutAmount),
                    );
                  }}
                >
                  Reset to auto
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                Working Area <span className="text-red-500">*</span>
              </Label>
              <Select value={workingArea} onValueChange={setWorkingArea}>
                <SelectTrigger
                  data-ocid="expenses.working_area.select"
                  className="border-[#E5EAF2]"
                >
                  <SelectValue placeholder="Select area..." />
                </SelectTrigger>
                <SelectContent>
                  {assignedAreas.map((area) => (
                    <SelectItem key={String(area.id)} value={area.name}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        {area.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                DA Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={daType}
                onValueChange={(v) => setDaType(v as "HQ" | "OutStation")}
              >
                <SelectTrigger
                  data-ocid="expenses.da_type.select"
                  className="border-[#E5EAF2]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HQ">Head Quarter</SelectItem>
                  <SelectItem value="OutStation">Out Station</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Notes</Label>
              <Input
                data-ocid="expenses.notes.input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Visit notes..."
                className="border-[#E5EAF2]"
              />
            </div>
          </div>

          {(km || taManual) && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-500 font-medium">
                  Travel Allowance (TA)
                </p>
                <p className="text-xl font-bold text-blue-700 mt-1">
                  ₹{taValue.toFixed(2)}
                </p>
                <p className="text-xs text-blue-400 mt-0.5">
                  {taOverride
                    ? "Manual entry"
                    : `${km} km × ₹${taRate.toFixed(2)}`}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-green-500 font-medium">
                  Daily Allowance (DA)
                </p>
                <p className="text-xl font-bold text-green-700 mt-1">
                  ₹{Number(da).toLocaleString()}
                </p>
                <p className="text-xs text-green-400 mt-0.5">
                  {daType === "HQ" ? "Head Quarter" : "Out Station"}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-500 font-medium">Total</p>
                <p className="text-xl font-bold text-purple-700 mt-1">
                  ₹{total.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <Button
            data-ocid="expenses.submit_button"
            className="mt-5 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !km || !date || !workingArea}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <IndianRupee className="mr-2 h-4 w-4" /> Log Expense
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Expense History */}
      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Expense History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex justify-center py-12"
              data-ocid="expenses.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : expenses.length === 0 ? (
            <div data-ocid="expenses.empty_state" className="text-center py-12">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No expenses logged yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC]">
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Working Area
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      DA Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      KM
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      TA
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      DA
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Total
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">
                      Notes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e, idx) => (
                    <TableRow
                      key={`${e.date}-${idx}`}
                      data-ocid={`expenses.item.${idx + 1}`}
                      className="hover:bg-[#F8FAFC]"
                    >
                      <TableCell className="text-sm font-medium text-gray-700">
                        {e.date}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {e.workingArea ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            {e.workingArea}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {e.daType ? (
                          <Badge
                            variant="outline"
                            className={
                              e.daType === "HQ"
                                ? "border-blue-200 text-blue-700 bg-blue-50 text-xs"
                                : "border-orange-200 text-orange-700 bg-orange-50 text-xs"
                            }
                          >
                            {e.daType === "HQ" ? "Head Quarter" : "Out Station"}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {String(e.kmTraveled)} km
                      </TableCell>
                      <TableCell className="text-sm font-medium text-blue-600">
                        ₹{formatTA(e.taAmount)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-green-600">
                        ₹{String(e.daAmount)}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-purple-600">
                        ₹
                        {(
                          Number(e.taAmount) / TA_SCALE +
                          Number(e.daAmount)
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                        {e.notes || "—"}
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

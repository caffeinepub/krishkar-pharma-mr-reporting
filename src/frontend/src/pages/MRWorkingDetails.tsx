import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FlaskConical,
  Gift,
  History,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShoppingBag,
  Stethoscope,
  User2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  DoctorCallSummary,
  MRProfile,
  ManagerAreaAssignment,
  ManagerProfile,
  WorkingPlan,
} from "../backend";
import { ManagerRole } from "../backend";
import { useActor } from "../hooks/useActor";

export default function MRWorkingDetails() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const enabled = !!actor && !isFetching;

  // ── Today's Working Plan ──────────────────────────────────
  const { data: workingPlans = [] } = useQuery<WorkingPlan[]>({
    queryKey: ["myWorkingPlans"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyWorkingPlans();
    },
    enabled,
  });

  const todayPlans = workingPlans.filter((p) => p.date === today);

  // ── Data Queries ──────────────────────────────────────────
  const { data: allAreas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: () => actor!.getAllAreas(),
    enabled,
  });

  const { data: allDoctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => actor!.getAllDoctors(),
    enabled,
  });

  const { data: allChemists = [] } = useQuery({
    queryKey: ["chemists"],
    queryFn: () => actor!.getAllChemists(),
    enabled,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getAllProducts(),
    enabled,
  });

  const { data: giftArticles = [] } = useQuery({
    queryKey: ["gift-articles"],
    queryFn: () => actor!.getAllGiftArticles(),
    enabled,
  });

  const { data: mrProfile } = useQuery<MRProfile>({
    queryKey: ["mr-profile"],
    queryFn: () => actor!.getMRProfile(),
    enabled,
  });

  // Assigned area IDs set
  const assignedAreaIds = useMemo(
    () => new Set((mrProfile?.assignedAreas ?? []).map((id) => String(id))),
    [mrProfile],
  );

  // Filter areas and doctors to assigned only
  const areas = useMemo(
    () => allAreas.filter((a) => assignedAreaIds.has(String(a.id))),
    [allAreas, assignedAreaIds],
  );

  const assignedDoctors = useMemo(
    () => allDoctors.filter((d) => assignedAreaIds.has(String(d.areaId))),
    [allDoctors, assignedAreaIds],
  );

  const assignedChemists = useMemo(
    () => allChemists.filter((c) => assignedAreaIds.has(String(c.areaId))),
    [allChemists, assignedAreaIds],
  );

  // ── Shared area for Daily Activity tab ───────────────────
  const [visitAreaId, setVisitAreaId] = useState("");
  const [visitDoctorId, setVisitDoctorId] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );

  // Sample state
  const [sampleProductId, setSampleProductId] = useState("");
  const [sampleQty, setSampleQty] = useState("");

  // Gift distribution state
  const [giftArticleId, setGiftArticleId] = useState("");
  const [giftQty, setGiftQty] = useState("");

  // Chemist order state (same area as doctor)
  const [orderChemistId, setOrderChemistId] = useState("");
  // Add Chemist inline state
  const [showAddChemist, setShowAddChemist] = useState(false);
  const [newChemistName, setNewChemistName] = useState("");
  const [newChemistAreaId, setNewChemistAreaId] = useState("");
  const [newChemistAddress, setNewChemistAddress] = useState("");
  const [newChemistContact, setNewChemistContact] = useState("");

  const addChemistMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addChemist(
        newChemistName,
        BigInt(newChemistAreaId),
        newChemistAddress,
        newChemistContact,
      );
    },
    onSuccess: () => {
      toast.success("Chemist added");
      setShowAddChemist(false);
      setNewChemistName("");
      setNewChemistAreaId("");
      setNewChemistAddress("");
      setNewChemistContact("");
      queryClient.invalidateQueries({ queryKey: ["chemists"] });
    },
    onError: () => toast.error("Failed to add chemist"),
  });

  const [orderProductId, setOrderProductId] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [orderScheme, setOrderScheme] = useState("");

  const filteredDoctors = useMemo(() => {
    const byArea = visitAreaId
      ? assignedDoctors.filter((d) => String(d.areaId) === visitAreaId)
      : assignedDoctors;
    if (!doctorSearch.trim()) return byArea;
    return byArea.filter((d) =>
      d.name.toLowerCase().includes(doctorSearch.toLowerCase()),
    );
  }, [assignedDoctors, visitAreaId, doctorSearch]);

  const filteredChemists = useMemo(
    () =>
      visitAreaId
        ? assignedChemists.filter((c) => String(c.areaId) === visitAreaId)
        : assignedChemists,
    [assignedChemists, visitAreaId],
  );

  // ── Add New Doctor Dialog ─────────────────────────────────
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorQual, setNewDoctorQual] = useState("");
  const [newDoctorStation, setNewDoctorStation] = useState("");
  const [newDoctorSpec, setNewDoctorSpec] = useState("");
  const [newDoctorAreaId, setNewDoctorAreaId] = useState("");
  const [newDoctorMobile, setNewDoctorMobile] = useState("");
  const [newDoctorDOB, setNewDoctorDOB] = useState("");

  const addDoctorMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addDoctor(
        newDoctorName,
        newDoctorQual,
        newDoctorStation,
        newDoctorSpec,
        BigInt(newDoctorAreaId),
        newDoctorMobile ? [newDoctorMobile] : [],
        newDoctorDOB ? [newDoctorDOB] : [],
      );
    },
    onSuccess: () => {
      toast.success("Doctor added successfully");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setShowAddDoctor(false);
      setNewDoctorName("");
      setNewDoctorQual("");
      setNewDoctorStation("");
      setNewDoctorSpec("");
      setNewDoctorAreaId("");
      setNewDoctorMobile("");
      setNewDoctorDOB("");
    },
    onError: () => toast.error("Failed to add doctor"),
  });

  // ── Mutations ─────────────────────────────────────────────
  const detailingMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const productIds = Array.from(selectedProductIds).map((id) => BigInt(id));
      // Capture GPS coordinates at time of submission
      let lat: number | null = null;
      let lng: number | null = null;
      if (navigator?.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition | null>(
            (resolve) => {
              navigator.geolocation.getCurrentPosition(
                (p) => resolve(p),
                () => resolve(null),
                { timeout: 8000, maximumAge: 60000 },
              );
            },
          );
          if (pos) {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          }
        } catch {
          // silently ignore
        }
      }
      await actor.logDetailing(
        BigInt(visitDoctorId),
        date,
        productIds,
        lat,
        lng,
      );
    },
    onError: () => toast.error("Failed to log detailing"),
  });

  const sampleMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.logSample(
        BigInt(visitDoctorId),
        date,
        BigInt(sampleProductId),
        BigInt(sampleQty),
      );
    },
    onError: () => toast.error("Failed to log sample"),
  });

  const giftDistMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const doctor = allDoctors.find((d) => String(d.id) === visitDoctorId);
      const article = giftArticles.find((a) => String(a.id) === giftArticleId);
      if (!doctor || !article) throw new Error("Invalid selection");
      await actor.logGiftDistribution(
        BigInt(visitDoctorId),
        doctor.name,
        BigInt(giftArticleId),
        article.name,
        BigInt(giftQty),
        date,
      );
    },
    onError: () => toast.error("Failed to log gift distribution"),
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addChemistOrder(
        BigInt(orderChemistId),
        date,
        BigInt(orderProductId),
        BigInt(orderQty),
        orderScheme,
      );
    },
    onSuccess: () => {
      toast.success("Chemist order logged");
      setOrderChemistId("");
      setOrderProductId("");
      setOrderQty("");
      setOrderScheme("");
    },
    onError: () => toast.error("Failed to log order"),
  });

  const [loggingDoctorActivity, setLoggingDoctorActivity] = useState(false);

  const handleLogDoctorActivity = async () => {
    if (!visitDoctorId) {
      toast.error("Please select a doctor first");
      return;
    }
    setLoggingDoctorActivity(true);
    try {
      if (selectedProductIds.size > 0) {
        await detailingMutation.mutateAsync();
      }
      if (sampleProductId && sampleQty) {
        await sampleMutation.mutateAsync();
      }
      if (giftArticleId && giftQty) {
        await giftDistMutation.mutateAsync();
      }
      toast.success("Doctor activity logged successfully");
      setVisitDoctorId("");
      setDoctorSearch("");
      setSelectedProductIds(new Set());
      setSampleProductId("");
      setSampleQty("");
      setGiftArticleId("");
      setGiftQty("");
    } catch {
      // individual mutations already show errors
    } finally {
      setLoggingDoctorActivity(false);
    }
  };

  // ── Section 4: Daily Expense ──────────────────────────────
  const [expenseKm, setExpenseKm] = useState("");
  const [expenseDa, setExpenseDa] = useState<"250" | "300">("300");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseWorkingArea, setExpenseWorkingArea] = useState("");
  const [expenseDaType, setExpenseDaType] = useState<
    "HQ" | "OutStation" | "ExStation"
  >("HQ");

  const taAmount = useMemo(() => {
    const km = Number.parseFloat(expenseKm) || 0;
    return (km * 2.75).toFixed(2);
  }, [expenseKm]);

  const expenseMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addExpenseWithGeoTag(
        date,
        BigInt(expenseKm || "0"),
        BigInt(expenseDa),
        expenseNotes,
        BigInt(Math.round(Number.parseFloat(taAmount))),
        expenseWorkingArea,
        expenseDaType,
        null,
        null,
      );
    },
    onSuccess: () => {
      toast.success("Expense logged successfully");
      setExpenseKm("");
      setExpenseNotes("");
      setExpenseWorkingArea("");
      setExpenseDaType("HQ");
    },
    onError: () => toast.error("Failed to log expense"),
  });

  // ── Section 6: Gift Demand Order ─────────────────────────
  const [demandArticleId, setDemandArticleId] = useState("");
  const [demandQty, setDemandQty] = useState("");
  const [demandNotes, setDemandNotes] = useState("");

  const giftDemandMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const article = giftArticles.find(
        (a) => String(a.id) === demandArticleId,
      );
      if (!article) throw new Error("Invalid selection");
      await actor.raiseGiftDemandOrder(
        BigInt(demandArticleId),
        article.name,
        BigInt(demandQty),
        demandNotes,
        date,
      );
    },
    onSuccess: () => {
      toast.success("Gift demand order raised!");
      setDemandArticleId("");
      setDemandQty("");
      setDemandNotes("");
    },
    onError: () => toast.error("Failed to raise gift demand"),
  });

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset selections when area changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger
  useEffect(() => {
    setVisitDoctorId("");
    setOrderChemistId("");
    setDoctorSearch("");
  }, [visitAreaId]);

  // ── Working Mode Header ───────────────────────────────────
  const [workingMode, setWorkingMode] = useState("alone");
  const [workingWith, setWorkingWith] = useState("");
  const [stationType, setStationType] = useState("plan");
  const [savingHeader, setSavingHeader] = useState(false);
  const [useOtherName, setUseOtherName] = useState(false);

  // Fetch ASM & RSM names for the selected/assigned area for "Working With" dropdown
  const { data: staffNames = [], isLoading: staffNamesLoading } = useQuery<
    string[]
  >({
    queryKey: [
      "asmRsmStaffNames",
      visitAreaId,
      mrProfile?.assignedAreas?.join(","),
    ],
    queryFn: async () => {
      if (!actor) return [];
      const managerProfiles = await (actor.getAllManagerProfiles() as Promise<
        Array<[unknown, ManagerProfile]>
      >);
      // Only keep ASM and RSM roles
      const asmRsmManagers = managerProfiles.filter(
        ([, p]) =>
          p.managerRole === ManagerRole.ASM ||
          p.managerRole === ManagerRole.RSM,
      );
      if (asmRsmManagers.length === 0) return [];

      // Fetch area assignments for all ASM/RSM in parallel
      const areaAssignments = await Promise.all(
        asmRsmManagers.map(([principal]) =>
          (
            actor.getManagerAreas(
              principal as any,
            ) as Promise<ManagerAreaAssignment>
          ).catch(() => ({ areaIds: [] as bigint[] })),
        ),
      );

      // Determine which area IDs to filter by
      const filterAreaIds: Set<string> = new Set();
      if (visitAreaId) {
        filterAreaIds.add(String(visitAreaId));
      } else if (mrProfile?.assignedAreas) {
        for (const id of mrProfile.assignedAreas) {
          filterAreaIds.add(String(id));
        }
      }

      // Filter managers by area overlap
      let filteredManagers = asmRsmManagers.filter((_, idx) => {
        if (filterAreaIds.size === 0) return true;
        return areaAssignments[idx].areaIds.some((id) =>
          filterAreaIds.has(String(id)),
        );
      });

      // Fallback: if no managers match, show all ASM/RSM
      if (filteredManagers.length === 0) {
        filteredManagers = asmRsmManagers;
      }

      const names = filteredManagers
        .map(([, p]) => p.name)
        .filter((n) => n && n.trim().length > 0);
      return Array.from(new Set(names)).sort();
    },
    enabled,
  });

  // Pre-populate from today's plan
  useEffect(() => {
    if (todayPlans.length > 0) {
      const plan = todayPlans[0];
      setWorkingMode(plan.workingMode ?? "alone");
      const savedWith = plan.workingWith ?? "";
      setWorkingWith(savedWith);
      if (
        savedWith &&
        staffNames.length > 0 &&
        !staffNames.includes(savedWith)
      ) {
        setUseOtherName(true);
      } else {
        setUseOtherName(false);
      }
      setStationType(plan.stationType ?? "plan");
    }
  }, [todayPlans, staffNames]);

  const handleSaveHeader = async () => {
    if (!actor) return;
    setSavingHeader(true);
    try {
      await actor.addWorkingPlan({
        date: today,
        content: todayPlans[0]?.content ?? "",
        workingMode,
        workingWith:
          workingMode === "with" && workingWith ? workingWith : undefined,
        stationType,
      });
      toast.success("Working mode saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingHeader(false);
    }
  };

  const selectedDoctor = useMemo(
    () => allDoctors.find((d) => String(d.id) === visitDoctorId),
    [allDoctors, visitDoctorId],
  );

  // ── Last 2 Doctor Calls ───────────────────────────────────
  const [lastCallsExpanded, setLastCallsExpanded] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (visitDoctorId) {
      setLastCallsExpanded(true);
    }
  }, [visitDoctorId]);

  const { data: doctorCallHistory = [], isFetching: callHistoryFetching } =
    useQuery<DoctorCallSummary[]>({
      queryKey: ["doctorCallHistory", visitDoctorId],
      queryFn: async () => {
        if (!actor || !visitDoctorId) return [];
        return actor.getDoctorCallHistory(BigInt(visitDoctorId));
      },
      enabled: !!actor && !isFetching && !!visitDoctorId,
    });

  const lastTwoCalls = doctorCallHistory.slice(0, 2);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Today's Working Mode Card ── */}
      <Card className="border border-[#E5EAF2] shadow-sm rounded-xl bg-white">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-[#F1F5F9]">
          <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <User2 size={16} className="text-[#0B2F6B]" />
            Today's Working Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Working Mode
              </Label>
              <Select value={workingMode} onValueChange={setWorkingMode}>
                <SelectTrigger
                  data-ocid="working_details.working_mode.select"
                  className="border-[#E5EAF2]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alone">Alone</SelectItem>
                  <SelectItem value="with">With Someone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Station Type
              </Label>
              <Select value={stationType} onValueChange={setStationType}>
                <SelectTrigger
                  data-ocid="working_details.station_type.select"
                  className="border-[#E5EAF2]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan">As Per Working Plan</SelectItem>
                  <SelectItem value="other">Other Station</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {workingMode === "with" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Working With (ASM / RSM of Your Area)
              </Label>
              <Select
                value={useOtherName ? "__other__" : workingWith}
                onValueChange={(val) => {
                  if (val === "__other__") {
                    setUseOtherName(true);
                    setWorkingWith("");
                  } else {
                    setUseOtherName(false);
                    setWorkingWith(val);
                  }
                }}
              >
                <SelectTrigger
                  data-ocid="working_details.working_with.select"
                  className="border-[#E5EAF2]"
                >
                  <SelectValue
                    placeholder={
                      staffNamesLoading
                        ? "Loading ASM/RSM..."
                        : "Select ASM/RSM or type manually"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {staffNamesLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading
                      staff...
                    </div>
                  ) : (
                    staffNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))
                  )}
                  <SelectItem value="__other__">
                    Other (type manually)
                  </SelectItem>
                </SelectContent>
              </Select>
              {useOtherName && (
                <Input
                  data-ocid="working_details.working_with.input"
                  placeholder="Enter name manually..."
                  value={workingWith}
                  onChange={(e) => setWorkingWith(e.target.value)}
                  className="border-[#E5EAF2] mt-2"
                />
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              data-ocid="working_details.save_mode.button"
              className="bg-[#0B2F6B] hover:bg-[#0E5AA7]"
              onClick={handleSaveHeader}
              disabled={savingHeader}
              size="sm"
            >
              {savingHeader ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {savingHeader ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {todayPlans.length > 0 && (
        <Card className="bg-blue-50 border border-blue-200 shadow-sm rounded-xl">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-600" />
              Today's Working Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            {todayPlans.map((plan) => (
              <div
                key={String(plan.id)}
                className="bg-white rounded-lg p-3 border border-blue-100 space-y-1"
              >
                <p className="text-sm text-gray-800">{plan.content}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {plan.workingMode === "alone"
                      ? "Working Alone"
                      : `With: ${plan.workingWith || "Someone"}`}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      plan.stationType === "plan"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}
                  >
                    {plan.stationType === "plan"
                      ? "As Per Working Plan"
                      : "Other Station"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Page header with date picker */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Working Details</h2>
          <p className="text-sm text-gray-400">
            Log your daily field activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="work-date"
            className="text-sm font-medium text-gray-600"
          >
            Date:
          </Label>
          <Input
            id="work-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44 border-[#E5EAF2]"
          />
        </div>
      </div>

      <Tabs defaultValue="daily-activity">
        <TabsList className="grid w-full grid-cols-3 bg-[#F8FAFC] border border-[#E5EAF2] text-xs sm:text-sm">
          <TabsTrigger
            value="daily-activity"
            data-ocid="working_details.daily_activity.tab"
            className="flex items-center gap-1.5 text-xs"
          >
            <Stethoscope size={14} /> Daily Activity
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            data-ocid="working_details.expenses.tab"
            className="flex items-center gap-1.5 text-xs"
          >
            <DollarSign size={14} /> Expenses
          </TabsTrigger>
          <TabsTrigger
            value="gift-demand"
            data-ocid="working_details.gift_demand.tab"
            className="flex items-center gap-1.5 text-xs"
          >
            <Gift size={14} /> Gift Order
          </TabsTrigger>
        </TabsList>

        {/* ── Daily Activity Tab (Doctor + Sample + Gift + Chemist merged) ── */}
        <TabsContent value="daily-activity" className="mt-4">
          <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Daily Activity Entry
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Doctor visit, samples, gifts & chemist orders in one place
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* ── Row: Area ── */}
              <div className="flex items-start gap-4 px-5 py-4 border-b border-[#F1F5F9]">
                <div className="w-36 shrink-0 pt-1">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Area
                  </Label>
                </div>
                <div className="flex-1">
                  <Select value={visitAreaId} onValueChange={setVisitAreaId}>
                    <SelectTrigger
                      data-ocid="working_details.visit_area.select"
                      className="border-[#E5EAF2]"
                    >
                      <SelectValue placeholder="Select area..." />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem
                          key={String(area.id)}
                          value={String(area.id)}
                        >
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── Row: Doctor ── */}
              <div className="flex items-start gap-4 px-5 py-4 border-b border-[#F1F5F9]">
                <div className="w-36 shrink-0 pt-1">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Doctor
                  </Label>
                </div>
                <div className="flex-1 space-y-2">
                  {assignedDoctors.length > 3 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        data-ocid="working_details.doctor_search.input"
                        placeholder="Search doctor by name..."
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        className="pl-9 border-[#E5EAF2]"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={visitDoctorId}
                        onValueChange={setVisitDoctorId}
                      >
                        <SelectTrigger
                          data-ocid="working_details.visit_doctor.select"
                          className="border-[#E5EAF2]"
                        >
                          <SelectValue
                            placeholder={
                              visitAreaId
                                ? "Select doctor..."
                                : "Select area first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {filteredDoctors.map((doc) => (
                            <SelectItem
                              key={String(doc.id)}
                              value={String(doc.id)}
                            >
                              {doc.name} — {doc.qualification}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      data-ocid="working_details.add_doctor.button"
                      size="icon"
                      variant="outline"
                      className="shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50 w-9 h-9"
                      onClick={() => setShowAddDoctor(true)}
                      title="Add new doctor"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedDoctor && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-900">
                          {selectedDoctor.name}
                        </p>
                        {selectedDoctor.mobileNumber?.[0] && (
                          <p className="text-xs text-blue-700 mt-0.5 flex items-center gap-1">
                            <span>📞</span>
                            <span>{selectedDoctor.mobileNumber[0]}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Last 2 Calls Panel ── */}
                  {visitDoctorId && (
                    <div className="rounded-lg border border-[#E5EAF2] overflow-hidden">
                      <button
                        type="button"
                        data-ocid="working_details.last_calls.toggle"
                        onClick={() => setLastCallsExpanded((v) => !v)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#F8FAFC] hover:bg-[#F0F5FF] transition-colors"
                      >
                        <span className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <History className="w-3.5 h-3.5 text-[#0B2F6B]" />
                          Last 2 Calls
                          {!callHistoryFetching && lastTwoCalls.length > 0 && (
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                              {lastTwoCalls.length}
                            </span>
                          )}
                        </span>
                        {lastCallsExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>

                      {lastCallsExpanded && (
                        <div
                          className="px-3 py-3 space-y-2 bg-white border-t border-[#E5EAF2]"
                          data-ocid="working_details.last_calls.panel"
                        >
                          {callHistoryFetching ? (
                            <div
                              className="space-y-2"
                              data-ocid="working_details.last_calls.loading_state"
                            >
                              <Skeleton className="h-16 w-full" />
                              <Skeleton className="h-16 w-full" />
                            </div>
                          ) : lastTwoCalls.length === 0 ? (
                            <p
                              className="text-xs text-gray-400 text-center py-2"
                              data-ocid="working_details.last_calls.empty_state"
                            >
                              No previous visits recorded
                            </p>
                          ) : (
                            lastTwoCalls.map((call) => {
                              const productNames = call.productIds.map((id) => {
                                const found = allProducts.find(
                                  (p) => String(p.id) === String(id),
                                );
                                return found?.name ?? `#${id}`;
                              });
                              return (
                                <div
                                  key={call.date}
                                  className="rounded-lg border border-[#E5EAF2] bg-[#F8FAFC] p-3 space-y-2"
                                >
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 w-fit"
                                  >
                                    <CalendarDays className="w-3 h-3" />
                                    {call.date}
                                  </Badge>

                                  {productNames.length > 0 && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                        Products Detailed
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {productNames.map((name) => (
                                          <Badge
                                            key={name}
                                            className="bg-blue-100 text-blue-700 border-0 text-xs"
                                          >
                                            {name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {call.samples.length > 0 && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                        <FlaskConical className="w-3 h-3 text-teal-500" />{" "}
                                        Samples
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {call.samples.map((s) => {
                                          const pName =
                                            allProducts.find(
                                              (p) =>
                                                String(p.id) ===
                                                String(s.productId),
                                            )?.name ?? `#${s.productId}`;
                                          return (
                                            <Badge
                                              key={String(s.productId)}
                                              className="bg-teal-50 text-teal-700 border border-teal-200 text-xs"
                                            >
                                              {pName} × {String(s.quantity)}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {call.gifts.length > 0 && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                        <Gift className="w-3 h-3 text-purple-500" />{" "}
                                        Gifts
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {call.gifts.map((g) => (
                                          <Badge
                                            key={g.giftArticleName}
                                            className="bg-purple-50 text-purple-700 border border-purple-200 text-xs"
                                          >
                                            {g.giftArticleName} ×{" "}
                                            {String(g.quantity)}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Row: Products ── */}
              <div className="flex items-start gap-4 px-5 py-4 border-b border-[#F1F5F9]">
                <div className="w-36 shrink-0 pt-1">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Products Detailed
                  </Label>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allProducts.map((p) => (
                      <div
                        key={String(p.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E5EAF2]"
                      >
                        <Checkbox
                          id={`wp-${p.id}`}
                          data-ocid="working_details.product.checkbox"
                          checked={selectedProductIds.has(String(p.id))}
                          onCheckedChange={() => toggleProduct(String(p.id))}
                        />
                        <label
                          htmlFor={`wp-${p.id}`}
                          className="text-xs text-gray-700 cursor-pointer"
                        >
                          {p.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedProductIds.size > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Array.from(selectedProductIds).map((id) => {
                        const p = allProducts.find((x) => String(x.id) === id);
                        return p ? (
                          <Badge
                            key={id}
                            className="bg-blue-100 text-blue-700 border-0 text-xs"
                          >
                            {p.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Row: Sample ── */}
              <div className="flex items-start gap-4 px-5 py-4 border-b border-[#F1F5F9]">
                <div className="w-36 shrink-0 pt-1">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <FlaskConical className="w-3.5 h-3.5 text-teal-500" />
                    Sample
                  </Label>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      value={sampleProductId}
                      onValueChange={setSampleProductId}
                    >
                      <SelectTrigger
                        data-ocid="working_details.sample_product.select"
                        className="border-[#E5EAF2]"
                      >
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allProducts.map((p) => (
                          <SelectItem key={String(p.id)} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    data-ocid="working_details.sample_qty.input"
                    value={sampleQty}
                    onChange={(e) => setSampleQty(e.target.value)}
                    placeholder="Qty"
                    min="1"
                    className="w-20 border-[#E5EAF2]"
                  />
                </div>
              </div>

              {/* ── Row: Gift Distribution ── */}
              <div className="flex items-start gap-4 px-5 py-4 border-b border-[#F1F5F9]">
                <div className="w-36 shrink-0 pt-1">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-purple-500" />
                    Gift Dist.
                  </Label>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      value={giftArticleId}
                      onValueChange={setGiftArticleId}
                    >
                      <SelectTrigger
                        data-ocid="working_details.gift_article.select"
                        className="border-[#E5EAF2]"
                      >
                        <SelectValue placeholder="Select gift article..." />
                      </SelectTrigger>
                      <SelectContent>
                        {giftArticles.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            No articles available
                          </SelectItem>
                        ) : (
                          giftArticles.map((a) => (
                            <SelectItem key={String(a.id)} value={String(a.id)}>
                              {a.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    data-ocid="working_details.gift_qty.input"
                    value={giftQty}
                    onChange={(e) => setGiftQty(e.target.value)}
                    placeholder="Qty"
                    min="1"
                    className="w-20 border-[#E5EAF2]"
                  />
                </div>
              </div>

              {/* ── Log Doctor Activity Button ── */}
              <div className="px-5 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <Button
                  data-ocid="working_details.log_doctor_activity.primary_button"
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                  onClick={handleLogDoctorActivity}
                  disabled={loggingDoctorActivity || !visitDoctorId}
                >
                  {loggingDoctorActivity ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging Doctor Activity...
                    </>
                  ) : (
                    <>
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Log Doctor Visit
                    </>
                  )}
                </Button>
              </div>

              {/* ── Divider: Chemist Order ── */}
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 h-px bg-[#E5EAF2]" />
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Chemist Order
                </span>
                <div className="flex-1 h-px bg-[#E5EAF2]" />
              </div>

              {/* ── Row: Chemist ── */}
              <div className="flex items-start gap-4 px-5 py-4 border-t border-[#F1F5F9]">
                <div className="w-36 shrink-0 pt-1">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Chemist
                  </Label>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={orderChemistId}
                      onValueChange={setOrderChemistId}
                    >
                      <SelectTrigger
                        data-ocid="working_details.order_chemist.select"
                        className="border-[#E5EAF2]"
                      >
                        <SelectValue
                          placeholder={
                            visitAreaId
                              ? "Select chemist..."
                              : "Select area first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredChemists.map((c) => (
                          <SelectItem key={String(c.id)} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-[#E5EAF2] text-blue-600 hover:text-blue-700"
                    onClick={() => setShowAddChemist(true)}
                    title="Add new chemist"
                  >
                    <Plus className="w-4 h-4 mr-1" /> New
                  </Button>
                </div>
                {/* Add Chemist Dialog */}
                <Dialog open={showAddChemist} onOpenChange={setShowAddChemist}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Chemist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">
                          Chemist Name
                        </Label>
                        <Input
                          value={newChemistName}
                          onChange={(e) => setNewChemistName(e.target.value)}
                          placeholder="Enter chemist name"
                          className="border-[#E5EAF2]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">
                          Area
                        </Label>
                        <Select
                          value={newChemistAreaId}
                          onValueChange={setNewChemistAreaId}
                        >
                          <SelectTrigger className="border-[#E5EAF2]">
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas.map((a) => (
                              <SelectItem
                                key={String(a.id)}
                                value={String(a.id)}
                              >
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">
                          Address
                        </Label>
                        <Input
                          value={newChemistAddress}
                          onChange={(e) => setNewChemistAddress(e.target.value)}
                          placeholder="Enter address"
                          className="border-[#E5EAF2]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">
                          Contact
                        </Label>
                        <Input
                          value={newChemistContact}
                          onChange={(e) => setNewChemistContact(e.target.value)}
                          placeholder="Enter contact number"
                          className="border-[#E5EAF2]"
                        />
                      </div>
                      <Button
                        className="w-full bg-[#0D5BA6] hover:bg-[#0a4f96] text-white mt-2"
                        onClick={() => addChemistMutation.mutate()}
                        disabled={
                          addChemistMutation.isPending ||
                          !newChemistName ||
                          !newChemistAreaId
                        }
                      >
                        {addChemistMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Adding...
                          </>
                        ) : (
                          "Add Chemist"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* ── Row: Order Product + Qty + Scheme ── */}
              <div className="flex items-start gap-4 px-5 py-4 border-t border-[#F1F5F9]">
                <div className="w-36 shrink-0 pt-1">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Order Details
                  </Label>
                </div>
                <div className="flex-1 space-y-3">
                  <Select
                    value={orderProductId}
                    onValueChange={setOrderProductId}
                  >
                    <SelectTrigger
                      data-ocid="working_details.order_product.select"
                      className="border-[#E5EAF2]"
                    >
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allProducts.map((p) => (
                        <SelectItem key={String(p.id)} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      data-ocid="working_details.order_qty.input"
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      placeholder="Quantity"
                      min="1"
                      className="flex-1 border-[#E5EAF2]"
                    />
                    <Input
                      data-ocid="working_details.order_scheme.input"
                      value={orderScheme}
                      onChange={(e) => setOrderScheme(e.target.value)}
                      placeholder="Scheme (e.g. 10+2)"
                      className="flex-1 border-[#E5EAF2]"
                    />
                  </div>
                </div>
              </div>

              {/* ── Log Chemist Order Button ── */}
              <div className="px-5 py-4 bg-[#FFFBF5]">
                <Button
                  data-ocid="working_details.order.submit_button"
                  className="bg-amber-600 hover:bg-amber-700 text-white w-full"
                  onClick={() => orderMutation.mutate()}
                  disabled={
                    orderMutation.isPending ||
                    !orderChemistId ||
                    !orderProductId ||
                    !orderQty
                  }
                >
                  {orderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4" /> Log Chemist Order
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Section 4: Daily Expense ── */}
        <TabsContent value="expenses">
          <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Daily Expense
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Log travel allowance and daily allowance
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    KM Traveled
                  </Label>
                  <Input
                    type="number"
                    data-ocid="working_details.expense_km.input"
                    value={expenseKm}
                    onChange={(e) => setExpenseKm(e.target.value)}
                    placeholder="Enter kilometers"
                    min="0"
                    className="border-[#E5EAF2]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Daily Allowance (DA)
                  </Label>
                  <Select
                    value={expenseDa}
                    onValueChange={(v) => setExpenseDa(v as "250" | "300")}
                  >
                    <SelectTrigger
                      data-ocid="working_details.expense_da.select"
                      className="border-[#E5EAF2]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="250">₹250</SelectItem>
                      <SelectItem value="300">₹300</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Working Area <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={expenseWorkingArea}
                    onValueChange={setExpenseWorkingArea}
                  >
                    <SelectTrigger
                      data-ocid="working_details.expense_area.select"
                      className="border-[#E5EAF2]"
                    >
                      <SelectValue placeholder="Select area..." />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
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
                  <Label className="text-sm font-medium text-gray-700">
                    DA Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={expenseDaType}
                    onValueChange={(v) =>
                      setExpenseDaType(v as "HQ" | "OutStation" | "ExStation")
                    }
                  >
                    <SelectTrigger
                      data-ocid="working_details.expense_datype.select"
                      className="border-[#E5EAF2]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HQ">Head Quarter</SelectItem>
                      <SelectItem value="OutStation">Out Station</SelectItem>
                      <SelectItem value="ExStation">Ex-Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {expenseKm && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                    TA Calculation
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {expenseKm}
                      </p>
                      <p className="text-xs text-gray-500">KM</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{taAmount}
                      </p>
                      <p className="text-xs text-gray-500">TA (@ ₹2.75/km)</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-700">
                        ₹
                        {(
                          Number.parseFloat(taAmount) +
                          Number.parseFloat(expenseDa)
                        ).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Total (TA+DA)</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Notes (Optional)
                </Label>
                <Textarea
                  data-ocid="working_details.expense_notes.textarea"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="border-[#E5EAF2] resize-none"
                  rows={3}
                />
              </div>

              <Button
                data-ocid="working_details.expense.submit_button"
                className="bg-green-600 hover:bg-green-700 text-white w-full"
                onClick={() => expenseMutation.mutate()}
                disabled={
                  expenseMutation.isPending || !expenseKm || !expenseWorkingArea
                }
              >
                {expenseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" /> Log Daily Expense
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Section: Gift Demand Order ── */}
        <TabsContent value="gift-demand">
          <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Gift Demand Order
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Raise a demand for gift articles from admin
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Gift Article
                  </Label>
                  <Select
                    value={demandArticleId}
                    onValueChange={setDemandArticleId}
                  >
                    <SelectTrigger
                      data-ocid="working_details.demand_article.select"
                      className="border-[#E5EAF2]"
                    >
                      <SelectValue placeholder="Select article..." />
                    </SelectTrigger>
                    <SelectContent>
                      {giftArticles.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          No articles available
                        </SelectItem>
                      ) : (
                        giftArticles.map((a) => (
                          <SelectItem key={String(a.id)} value={String(a.id)}>
                            {a.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    data-ocid="working_details.demand_qty.input"
                    value={demandQty}
                    onChange={(e) => setDemandQty(e.target.value)}
                    placeholder="Enter quantity"
                    min="1"
                    className="border-[#E5EAF2]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Notes (Optional)
                </Label>
                <Textarea
                  data-ocid="working_details.demand_notes.textarea"
                  value={demandNotes}
                  onChange={(e) => setDemandNotes(e.target.value)}
                  placeholder="Reason or notes for demand..."
                  className="border-[#E5EAF2] resize-none"
                  rows={3}
                />
              </div>
              <Button
                data-ocid="working_details.demand.submit_button"
                className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                onClick={() => giftDemandMutation.mutate()}
                disabled={
                  giftDemandMutation.isPending || !demandArticleId || !demandQty
                }
              >
                {giftDemandMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Raising...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" /> Raise Gift Demand Order
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add New Doctor Dialog ── */}
      <Dialog open={showAddDoctor} onOpenChange={setShowAddDoctor}>
        <DialogContent
          className="sm:max-w-lg"
          data-ocid="working_details.add_doctor.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Add New Doctor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-medium text-gray-600">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  data-ocid="working_details.new_doctor_name.input"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  placeholder="Dr. Rajesh Sharma"
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Qualification
                </Label>
                <Input
                  data-ocid="working_details.new_doctor_qual.input"
                  value={newDoctorQual}
                  onChange={(e) => setNewDoctorQual(e.target.value)}
                  placeholder="MBBS, MD"
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Station
                </Label>
                <Input
                  data-ocid="working_details.new_doctor_station.input"
                  value={newDoctorStation}
                  onChange={(e) => setNewDoctorStation(e.target.value)}
                  placeholder="City / Town"
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Specialization
                </Label>
                <Input
                  data-ocid="working_details.new_doctor_spec.input"
                  value={newDoctorSpec}
                  onChange={(e) => setNewDoctorSpec(e.target.value)}
                  placeholder="General Physician"
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Area <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newDoctorAreaId}
                  onValueChange={setNewDoctorAreaId}
                >
                  <SelectTrigger
                    data-ocid="working_details.new_doctor_area.select"
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
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Mobile Number
                </Label>
                <Input
                  data-ocid="working_details.new_doctor_mobile.input"
                  value={newDoctorMobile}
                  onChange={(e) => setNewDoctorMobile(e.target.value)}
                  placeholder="9876543210"
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Date of Birth
                </Label>
                <Input
                  data-ocid="working_details.new_doctor_dob.input"
                  type="date"
                  value={newDoctorDOB}
                  onChange={(e) => setNewDoctorDOB(e.target.value)}
                  className="border-[#E5EAF2]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                data-ocid="working_details.add_doctor.submit_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={() => addDoctorMutation.mutate()}
                disabled={
                  addDoctorMutation.isPending ||
                  !newDoctorName ||
                  !newDoctorAreaId
                }
              >
                {addDoctorMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Doctor"
                )}
              </Button>
              <Button
                variant="outline"
                data-ocid="working_details.add_doctor.cancel_button"
                onClick={() => setShowAddDoctor(false)}
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

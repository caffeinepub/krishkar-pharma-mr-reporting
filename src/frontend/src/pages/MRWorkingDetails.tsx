import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  FlaskConical,
  Gift,
  Loader2,
  MapPin,
  ShoppingBag,
  Stethoscope,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { MRProfile } from "../backend";
import { useActor } from "../hooks/useActor";

export default function MRWorkingDetails() {
  const { actor, isFetching } = useActor();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const enabled = !!actor && !isFetching;

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

  // ── Section 1: Doctor Visit ───────────────────────────────
  const [visitAreaId, setVisitAreaId] = useState("");
  const [visitDoctorId, setVisitDoctorId] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );

  const filteredDoctors = useMemo(
    () =>
      visitAreaId
        ? assignedDoctors.filter((d) => String(d.areaId) === visitAreaId)
        : assignedDoctors,
    [assignedDoctors, visitAreaId],
  );

  const detailingMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const productIds = Array.from(selectedProductIds).map((id) => BigInt(id));
      await actor.logDetailing(BigInt(visitDoctorId), date, productIds);
    },
    onSuccess: () => {
      toast.success("Doctor visit logged successfully");
      setVisitDoctorId("");
      setSelectedProductIds(new Set());
    },
    onError: () => toast.error("Failed to log detailing"),
  });

  // ── Section 2: Sample Distribution ───────────────────────
  const [sampleDoctorId, setSampleDoctorId] = useState("");
  const [sampleProductId, setSampleProductId] = useState("");
  const [sampleQty, setSampleQty] = useState("");

  const sampleMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.logSample(
        BigInt(sampleDoctorId),
        date,
        BigInt(sampleProductId),
        BigInt(sampleQty),
      );
    },
    onSuccess: () => {
      toast.success("Sample distribution logged");
      setSampleDoctorId("");
      setSampleProductId("");
      setSampleQty("");
    },
    onError: () => toast.error("Failed to log sample"),
  });

  // ── Section 3: Chemist Order ──────────────────────────────
  const [orderAreaId, setOrderAreaId] = useState("");
  const [orderChemistId, setOrderChemistId] = useState("");
  const [orderProductId, setOrderProductId] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [orderScheme, setOrderScheme] = useState("");

  const filteredChemists = useMemo(
    () =>
      orderAreaId
        ? assignedChemists.filter((c) => String(c.areaId) === orderAreaId)
        : assignedChemists,
    [assignedChemists, orderAreaId],
  );

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
      await actor.addExpense(
        date,
        BigInt(expenseKm || "0"),
        BigInt(expenseDa),
        expenseNotes,
        BigInt(Math.round(Number.parseFloat(taAmount))),
        expenseWorkingArea,
        expenseDaType,
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

  // ── Section 5: Gift Distribution ─────────────────────────
  const [giftDoctorId, setGiftDoctorId] = useState("");
  const [giftArticleId, setGiftArticleId] = useState("");
  const [giftQty, setGiftQty] = useState("");

  const giftDistMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const doctor = allDoctors.find((d) => String(d.id) === giftDoctorId);
      const article = giftArticles.find((a) => String(a.id) === giftArticleId);
      if (!doctor || !article) throw new Error("Invalid selection");
      await actor.logGiftDistribution(
        BigInt(giftDoctorId),
        doctor.name,
        BigInt(giftArticleId),
        article.name,
        BigInt(giftQty),
        date,
      );
    },
    onSuccess: () => {
      toast.success("Gift distribution logged");
      setGiftDoctorId("");
      setGiftArticleId("");
      setGiftQty("");
    },
    onError: () => toast.error("Failed to log gift distribution"),
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

  // Reset doctor selection when area changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger on visitAreaId change
  useEffect(() => {
    setVisitDoctorId("");
  }, [visitAreaId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger on orderAreaId change
  useEffect(() => {
    setOrderChemistId("");
  }, [orderAreaId]);

  return (
    <div className="space-y-6 max-w-4xl">
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

      <Tabs defaultValue="doctor-activity">
        <TabsList className="grid w-full grid-cols-4 bg-[#F8FAFC] border border-[#E5EAF2]">
          <TabsTrigger
            value="doctor-activity"
            data-ocid="working_details.doctor_activity.tab"
            className="flex items-center gap-1.5 text-xs"
          >
            <Stethoscope size={14} /> Doctor Activity
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            data-ocid="working_details.orders.tab"
            className="flex items-center gap-1.5 text-xs"
          >
            <ShoppingBag size={14} /> Chemist
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

        {/* ── Doctor Activity Tab (Visit + Sample + Gift Dist merged) ── */}
        <TabsContent value="doctor-activity" className="space-y-4 mt-4">
          {/* Sub-section 1: Doctor Visit & Detailing */}
          <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Doctor Visit & Detailing
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Record doctor visits and product detailing
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Area
                  </Label>
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
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Doctor
                  </Label>
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
                          visitAreaId ? "Select doctor..." : "Select area first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDoctors.map((doc) => (
                        <SelectItem key={String(doc.id)} value={String(doc.id)}>
                          {doc.name} — {doc.qualification}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Products Detailed
                </Label>
                <div className="grid grid-cols-2 gap-2">
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
              </div>

              {selectedProductIds.size > 0 && (
                <div className="flex flex-wrap gap-1">
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

              <Button
                data-ocid="working_details.detailing.submit_button"
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                onClick={() => detailingMutation.mutate()}
                disabled={
                  detailingMutation.isPending ||
                  !visitDoctorId ||
                  selectedProductIds.size === 0
                }
              >
                {detailingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...
                  </>
                ) : (
                  <>
                    <Stethoscope className="mr-2 h-4 w-4" /> Log Doctor Visit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Sub-section 2: Sample Distribution */}
          <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Sample Distribution
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Record samples given to doctors
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Doctor
                  </Label>
                  <Select
                    value={sampleDoctorId}
                    onValueChange={setSampleDoctorId}
                  >
                    <SelectTrigger
                      data-ocid="working_details.sample_doctor.select"
                      className="border-[#E5EAF2]"
                    >
                      <SelectValue placeholder="Select doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedDoctors.map((doc) => (
                        <SelectItem key={String(doc.id)} value={String(doc.id)}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Product
                  </Label>
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Quantity
                </Label>
                <Input
                  type="number"
                  data-ocid="working_details.sample_qty.input"
                  value={sampleQty}
                  onChange={(e) => setSampleQty(e.target.value)}
                  placeholder="Enter quantity"
                  min="1"
                  className="border-[#E5EAF2]"
                />
              </div>
              <Button
                data-ocid="working_details.sample.submit_button"
                className="bg-teal-600 hover:bg-teal-700 text-white w-full"
                onClick={() => sampleMutation.mutate()}
                disabled={
                  sampleMutation.isPending ||
                  !sampleDoctorId ||
                  !sampleProductId ||
                  !sampleQty
                }
              >
                {sampleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...
                  </>
                ) : (
                  <>
                    <FlaskConical className="mr-2 h-4 w-4" /> Log Sample
                    Distribution
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Sub-section 3: Gift Distribution */}
          <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Gift Distribution
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Record gift articles distributed to doctors
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Doctor
                  </Label>
                  <Select value={giftDoctorId} onValueChange={setGiftDoctorId}>
                    <SelectTrigger
                      data-ocid="working_details.gift_doctor.select"
                      className="border-[#E5EAF2]"
                    >
                      <SelectValue placeholder="Select doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedDoctors.map((doc) => (
                        <SelectItem key={String(doc.id)} value={String(doc.id)}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Gift Article
                  </Label>
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Quantity
                </Label>
                <Input
                  type="number"
                  data-ocid="working_details.gift_qty.input"
                  value={giftQty}
                  onChange={(e) => setGiftQty(e.target.value)}
                  placeholder="Enter quantity"
                  min="1"
                  className="border-[#E5EAF2]"
                />
              </div>
              <Button
                data-ocid="working_details.gift_dist.submit_button"
                className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                onClick={() => giftDistMutation.mutate()}
                disabled={
                  giftDistMutation.isPending ||
                  !giftDoctorId ||
                  !giftArticleId ||
                  !giftQty
                }
              >
                {giftDistMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" /> Log Gift Distribution
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Section 3: Chemist Order ── */}
        <TabsContent value="orders">
          <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Chemist Order
                  </CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Log orders placed with chemists
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Area
                  </Label>
                  <Select value={orderAreaId} onValueChange={setOrderAreaId}>
                    <SelectTrigger
                      data-ocid="working_details.order_area.select"
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
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Chemist
                  </Label>
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
                          orderAreaId
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Product
                  </Label>
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
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    data-ocid="working_details.order_qty.input"
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    placeholder="Enter quantity"
                    min="1"
                    className="border-[#E5EAF2]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Scheme (Optional)
                  </Label>
                  <Input
                    data-ocid="working_details.order_scheme.input"
                    value={orderScheme}
                    onChange={(e) => setOrderScheme(e.target.value)}
                    placeholder="e.g. 10+2 free"
                    className="border-[#E5EAF2]"
                  />
                </div>
              </div>
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="mr-2 h-4 w-4" /> Log Chemist Order
                  </>
                )}
              </Button>
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
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-3 gap-3 text-center">
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

        {/* ── Section 6: Gift Demand Order ── */}
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
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    data-ocid="working_details.demand_qty.input"
                    value={demandQty}
                    onChange={(e) => setDemandQty(e.target.value)}
                    placeholder="Enter quantity needed"
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
                  placeholder="Reason or purpose..."
                  className="border-[#E5EAF2] resize-none"
                  rows={3}
                />
              </div>
              <Button
                data-ocid="working_details.gift_demand.submit_button"
                className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                onClick={() => giftDemandMutation.mutate()}
                disabled={
                  giftDemandMutation.isPending || !demandArticleId || !demandQty
                }
              >
                {giftDemandMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Submitting...
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
    </div>
  );
}

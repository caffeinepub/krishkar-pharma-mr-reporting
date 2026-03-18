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
  ClipboardList,
  DollarSign,
  FlaskConical,
  Loader2,
  ShoppingBag,
  Stethoscope,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

export default function MRWorkingDetails() {
  const { actor, isFetching } = useActor();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  // ── Data Queries ──────────────────────────────────────────
  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: () => actor!.getAllAreas(),
    enabled: !!actor && !isFetching,
  });

  const { data: allDoctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => actor!.getAllDoctors(),
    enabled: !!actor && !isFetching,
  });

  const { data: allChemists = [] } = useQuery({
    queryKey: ["chemists"],
    queryFn: () => actor!.getAllChemists(),
    enabled: !!actor && !isFetching,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getAllProducts(),
    enabled: !!actor && !isFetching,
  });

  // ── Section 1: Doctor Visit ───────────────────────────────
  const [visitAreaId, setVisitAreaId] = useState("");
  const [visitDoctorId, setVisitDoctorId] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );

  const filteredDoctors = useMemo(
    () =>
      visitAreaId
        ? allDoctors.filter((d) => String(d.areaId) === visitAreaId)
        : allDoctors,
    [allDoctors, visitAreaId],
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
  const [orderChemistId, setOrderChemistId] = useState("");
  const [orderProductId, setOrderProductId] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [orderScheme, setOrderScheme] = useState("");

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
      );
    },
    onSuccess: () => {
      toast.success("Expense logged successfully");
      setExpenseKm("");
      setExpenseNotes("");
    },
    onError: () => toast.error("Failed to log expense"),
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header with date picker */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Daily Working Entry
          </h2>
          <p className="text-sm text-gray-400">
            Log your daily field activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label
            htmlFor="work-date"
            className="text-sm text-gray-600 font-medium"
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

      <Tabs defaultValue="detailing">
        <TabsList className="grid w-full grid-cols-4 bg-[#F8FAFC] border border-[#E5EAF2]">
          <TabsTrigger
            value="detailing"
            data-ocid="working_details.detailing.tab"
            className="flex items-center gap-1.5 text-xs"
          >
            <Stethoscope size={14} /> Doctor Visit
          </TabsTrigger>
          <TabsTrigger
            value="samples"
            data-ocid="working_details.samples.tab"
            className="flex items-center gap-1.5 text-xs"
          >
            <FlaskConical size={14} /> Samples
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            data-ocid="working_details.orders.tab"
            className="flex items-center gap-1.5 text-xs"
          >
            <ShoppingBag size={14} /> Chemist Order
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            data-ocid="working_details.expenses.tab"
            className="flex items-center gap-1.5 text-xs"
          >
            <DollarSign size={14} /> Expenses
          </TabsTrigger>
        </TabsList>

        {/* ── Section 1: Doctor Visit & Detailing ── */}
        <TabsContent value="detailing">
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
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#F8FAFC] rounded-lg border border-[#E5EAF2]">
                  {allProducts.length === 0 && (
                    <p className="text-xs text-gray-400 col-span-2">
                      No products available
                    </p>
                  )}
                  {allProducts.map((product) => (
                    <div
                      key={String(product.id)}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={`product-${product.id}`}
                        data-ocid="working_details.product.checkbox"
                        checked={selectedProductIds.has(String(product.id))}
                        onCheckedChange={() =>
                          toggleProduct(String(product.id))
                        }
                      />
                      <Label
                        htmlFor={`product-${product.id}`}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {product.name}
                        <span className="ml-1 text-xs text-gray-400">
                          ({product.code})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedProductIds.size > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selectedProductIds).map((id) => {
                      const p = allProducts.find((x) => String(x.id) === id);
                      return p ? (
                        <Badge
                          key={id}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {p.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <Button
                data-ocid="working_details.detailing.submit_button"
                className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white w-full"
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
                    <ClipboardList className="mr-2 h-4 w-4" /> Log Doctor Visit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Section 2: Sample Distribution ── */}
        <TabsContent value="samples">
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
                      {allDoctors.map((doc) => (
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
                    Record orders placed at chemist shops
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectValue placeholder="Select chemist..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allChemists.map((c) => (
                        <SelectItem key={String(c.id)} value={String(c.id)}>
                          {c.name}
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

              {/* TA Calculation Live Preview */}
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
                disabled={expenseMutation.isPending || !expenseKm}
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
      </Tabs>
    </div>
  );
}

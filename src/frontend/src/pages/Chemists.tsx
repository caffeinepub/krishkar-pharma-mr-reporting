import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Loader2,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Area, Chemist, Product } from "../backend";
import { useActor } from "../hooks/useActor";
import { loadXlsx } from "../lib/xlsxLoader";

export default function Chemists() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [filterAreaId, setFilterAreaId] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedChemist, setSelectedChemist] = useState<Chemist | null>(null);

  const [cName, setCName] = useState("");
  const [cAreaId, setCAreaId] = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cContact, setCContact] = useState("");

  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [orderProductId, setOrderProductId] = useState("");
  const [orderQty, setOrderQty] = useState("1");
  const [orderScheme, setOrderScheme] = useState("");

  // Bulk upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkRows, setBulkRows] = useState<
    Array<{
      name: string;
      area: string;
      address: string;
      contact: string;
      areaId?: string;
      valid: boolean;
    }>
  >([]);
  const [bulkUploading, setBulkUploading] = useState(false);

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["areas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allChemists = [], isLoading } = useQuery<Chemist[]>({
    queryKey: ["chemists"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllChemists();
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

  const filtered =
    filterAreaId === "all"
      ? allChemists
      : allChemists.filter((c) => String(c.areaId) === filterAreaId);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addChemist(cName, BigInt(cAreaId), cAddress, cContact);
    },
    onSuccess: () => {
      toast.success("Chemist added");
      setShowAdd(false);
      setCName("");
      setCAreaId("");
      setCAddress("");
      setCContact("");
      queryClient.invalidateQueries({ queryKey: ["chemists"] });
    },
    onError: () => toast.error("Failed to add chemist"),
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !selectedChemist) throw new Error("No actor");
      await actor.addChemistOrder(
        selectedChemist.id,
        orderDate,
        BigInt(orderProductId),
        BigInt(orderQty),
        orderScheme,
      );
    },
    onSuccess: () => {
      toast.success("Order placed");
      setShowOrder(false);
      setOrderProductId("");
      setOrderQty("1");
      setOrderScheme("");
    },
    onError: () => toast.error("Failed to place order"),
  });

  const getAreaName = (areaId: bigint) =>
    areas.find((a) => a.id === areaId)?.name ?? String(areaId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = await loadXlsx();
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Array<Record<string, string>> = XLSX.utils.sheet_to_json(ws, {
        defval: "",
      });
      const parsed = rows.map((row) => {
        const name = String(row.Name ?? "").trim();
        const area = String(row.Area ?? "").trim();
        const address = String(row.Address ?? "").trim();
        const contact = String(row.Contact ?? "").trim();
        const matchedArea = areas.find(
          (a) => a.name.toLowerCase() === area.toLowerCase(),
        );
        return {
          name,
          area,
          address,
          contact,
          areaId: matchedArea ? String(matchedArea.id) : undefined,
          valid: !!name && !!matchedArea,
        };
      });
      setBulkRows(parsed);
    } catch {
      toast.error("Failed to parse Excel file");
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkUpload = async () => {
    const validRows = bulkRows.filter((r) => r.valid && r.areaId);
    if (!actor || validRows.length === 0) return;
    setBulkUploading(true);
    let success = 0;
    let fail = 0;
    for (const row of validRows) {
      try {
        await actor.addChemist(
          row.name,
          BigInt(row.areaId!),
          row.address,
          row.contact,
        );
        success++;
      } catch {
        fail++;
      }
    }
    setBulkUploading(false);
    queryClient.invalidateQueries({ queryKey: ["chemists"] });
    if (success > 0)
      toast.success(`${success} chemist(s) uploaded successfully`);
    if (fail > 0) toast.error(`${fail} row(s) failed to upload`);
    setBulkRows([]);
    setShowBulkUpload(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Chemist Management
          </h2>
          <p className="text-sm text-gray-500">
            {filtered.length} chemists found
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterAreaId} onValueChange={setFilterAreaId}>
            <SelectTrigger
              data-ocid="chemists.select"
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
            data-ocid="chemists.upload_button"
            variant="outline"
            className="border-[#0D5BA6] text-[#0D5BA6] hover:bg-blue-50 gap-2"
            onClick={() => setShowBulkUpload(true)}
          >
            <Upload className="w-4 h-4" /> Upload from Excel
          </Button>
          <Button
            data-ocid="chemists.open_modal_button"
            className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="w-4 h-4" /> Add Chemist
          </Button>
        </div>
      </div>

      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex justify-center py-12"
              data-ocid="chemists.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div data-ocid="chemists.empty_state" className="text-center py-12">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No chemists found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC]">
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Chemist Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Area
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Address
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Contact
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ch, idx) => (
                  <TableRow
                    key={String(ch.id)}
                    data-ocid={`chemists.item.${idx + 1}`}
                    className="hover:bg-[#F8FAFC]"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-600">
                          {ch.name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {ch.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3 text-gray-400" />{" "}
                        {getAreaName(ch.areaId)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {ch.address}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="w-3 h-3 text-gray-400" /> {ch.contact}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        data-ocid={`chemists.order.button.${idx + 1}`}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2 border-amber-200 text-amber-600 hover:bg-amber-50"
                        onClick={() => {
                          setSelectedChemist(ch);
                          setShowOrder(true);
                        }}
                      >
                        Place Order
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Chemist Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md" data-ocid="chemists.dialog">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Add New Chemist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Name
                </Label>
                <Input
                  data-ocid="chemists.name.input"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="Agarwal Medical"
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Area
                </Label>
                <Select value={cAreaId} onValueChange={setCAreaId}>
                  <SelectTrigger
                    data-ocid="chemists.area.select"
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                Address
              </Label>
              <Input
                data-ocid="chemists.address.input"
                value={cAddress}
                onChange={(e) => setCAddress(e.target.value)}
                placeholder="Shop No. 12, MG Road"
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                Contact Number
              </Label>
              <Input
                data-ocid="chemists.contact.input"
                value={cContact}
                onChange={(e) => setCContact(e.target.value)}
                placeholder="9876543210"
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="flex gap-3">
              <Button
                data-ocid="chemists.submit_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !cName || !cAreaId}
              >
                {addMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Chemist"
                )}
              </Button>
              <Button
                variant="outline"
                data-ocid="chemists.cancel_button"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={showOrder} onOpenChange={setShowOrder}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="chemists.order.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Place Order — {selectedChemist?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Date</Label>
              <Input
                type="date"
                data-ocid="chemists.order.date.input"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="border-[#E5EAF2]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">
                Product
              </Label>
              <Select value={orderProductId} onValueChange={setOrderProductId}>
                <SelectTrigger
                  data-ocid="chemists.order.select"
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Quantity
                </Label>
                <Input
                  type="number"
                  min="1"
                  data-ocid="chemists.order.qty.input"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Scheme
                </Label>
                <Input
                  data-ocid="chemists.order.scheme.input"
                  value={orderScheme}
                  onChange={(e) => setOrderScheme(e.target.value)}
                  placeholder="e.g. 10+1"
                  className="border-[#E5EAF2]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                data-ocid="chemists.order.submit_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={() => orderMutation.mutate()}
                disabled={orderMutation.isPending || !orderProductId}
              >
                {orderMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Place Order"
                )}
              </Button>
              <Button
                variant="outline"
                data-ocid="chemists.order.cancel_button"
                onClick={() => setShowOrder(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent
          className="sm:max-w-2xl"
          data-ocid="chemists.bulk_upload.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Bulk Upload Chemists from Excel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <p className="font-semibold mb-1">Excel Format Required:</p>
              <p>
                Columns:{" "}
                <span className="font-mono">
                  Name | Area | Address | Contact
                </span>
              </p>
              <p className="mt-1 text-blue-600">
                Area must exactly match an existing area name
                (case-insensitive).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                data-ocid="chemists.bulk_upload.upload_button"
                variant="outline"
                className="border-[#0D5BA6] text-[#0D5BA6] hover:bg-blue-50 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" /> Choose Excel File
              </Button>
              {bulkRows.length > 0 && (
                <span className="text-sm text-gray-600">
                  {bulkRows.filter((r) => r.valid).length} valid /{" "}
                  {bulkRows.filter((r) => !r.valid).length} invalid rows
                </span>
              )}
            </div>

            {bulkRows.length > 0 && (
              <div className="max-h-64 overflow-y-auto border border-[#E5EAF2] rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8FAFC]">
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Area</TableHead>
                      <TableHead className="text-xs">Address</TableHead>
                      <TableHead className="text-xs">Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkRows.map((row, i) => (
                      <TableRow
                        key={`${row.name}-${i}`}
                        className={row.valid ? "" : "bg-red-50"}
                      >
                        <TableCell>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              row.valid
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {row.valid ? "Valid" : "Invalid"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.name || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className={!row.areaId ? "text-red-500" : ""}>
                            {row.area || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.address || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.contact || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                data-ocid="chemists.bulk_upload.submit_button"
                className="flex-1 bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={handleBulkUpload}
                disabled={
                  bulkUploading || bulkRows.filter((r) => r.valid).length === 0
                }
              >
                {bulkUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                    Uploading...
                  </>
                ) : (
                  `Upload ${bulkRows.filter((r) => r.valid).length} Valid Rows`
                )}
              </Button>
              <Button
                variant="outline"
                data-ocid="chemists.bulk_upload.cancel_button"
                onClick={() => {
                  setShowBulkUpload(false);
                  setBulkRows([]);
                }}
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

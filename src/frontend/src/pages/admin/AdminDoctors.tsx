import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Doctor } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { loadXlsx } from "../../lib/xlsxLoader";

interface DoctorForm {
  name: string;
  qualification: string;
  station: string;
  specialization: string;
  areaId: string;
  mobileNumber: string;
  dob: string;
}

const emptyForm: DoctorForm = {
  name: "",
  qualification: "",
  station: "",
  specialization: "",
  areaId: "",
  mobileNumber: "",
  dob: "",
};

interface ParsedRow {
  name: string;
  qualification: string;
  station: string;
  specialization: string;
  areaName: string;
  areaId: number | null;
  mobileNumber: string;
  dob: string;
}

export default function AdminDoctors() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<DoctorForm>(emptyForm);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState<DoctorForm>(emptyForm);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [uploadParsing, setUploadParsing] = useState(false);

  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDoctors();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: areas, isLoading: loadingAreas } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAreas();
    },
    enabled: !!actor && !isFetching,
  });

  const areaMap = new Map((areas ?? []).map((a) => [a.id.toString(), a.name]));

  const addMutation = useMutation({
    mutationFn: async (form: DoctorForm) => {
      if (!actor) throw new Error("Not connected");
      await actor.addDoctor(
        form.name,
        form.qualification,
        form.station,
        form.specialization,
        BigInt(form.areaId),
        form.mobileNumber ? [form.mobileNumber] : [],
        form.dob ? [form.dob] : [],
      );
    },
    onSuccess: () => {
      toast.success("Doctor added successfully!");
      setAddOpen(false);
      setAddForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to add doctor: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: bigint; form: DoctorForm }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateDoctor(
        id,
        form.name,
        form.qualification,
        form.station,
        form.specialization,
        BigInt(form.areaId),
        form.mobileNumber ? [form.mobileNumber] : [],
        form.dob ? [form.dob] : [],
      );
    },
    onSuccess: () => {
      toast.success("Doctor updated successfully!");
      setEditingDoctor(null);
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to update doctor: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteDoctor(id);
    },
    onSuccess: () => {
      toast.success("Doctor deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to delete doctor: ${err.message}`),
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      if (!actor) throw new Error("Not connected");
      const validRows = rows.filter((r) => r.areaId !== null);
      const result = await actor.bulkAddDoctors(
        validRows.map((r) => ({
          name: r.name,
          qualification: r.qualification,
          station: r.station,
          specialization: r.specialization,
          areaId: BigInt(r.areaId as number),
          mobileNumber: r.mobileNumber || undefined,
          dob: r.dob ? [r.dob] : [],
        })),
      );
      return result.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} doctors uploaded successfully!`);
      setUploadOpen(false);
      setParsedRows([]);
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (err: Error) => toast.error(`Bulk upload failed: ${err.message}`),
  });

  const openEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setEditForm({
      name: doc.name,
      qualification: doc.qualification,
      station: doc.station,
      specialization: doc.specialization,
      areaId: doc.areaId.toString(),
      mobileNumber: doc.mobileNumber?.[0] ?? "",
      dob: doc.dob?.[0] ?? "",
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadParsing(true);
    setParsedRows([]);
    try {
      const XLSX = await loadXlsx();
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

      if (rows.length < 2) {
        toast.error("File appears empty or has no data rows.");
        return;
      }

      // Find header row
      const headers = (rows[0] ?? []).map((h) =>
        String(h ?? "")
          .toLowerCase()
          .trim(),
      );
      const nameIdx = headers.indexOf("name");
      const qualIdx = headers.indexOf("qualification");
      const stationIdx = headers.indexOf("station");
      const specIdx = headers.indexOf("specialization");
      const areaIdx = headers.indexOf("area");
      // Support "mobile number" or "mobile" column
      const mobileIdx =
        headers.indexOf("mobile number") !== -1
          ? headers.indexOf("mobile number")
          : headers.indexOf("mobile");
      const dobIdx = headers.indexOf("dob");

      const areaNameMap = new Map(
        (areas ?? []).map((a) => [a.name.toLowerCase().trim(), Number(a.id)]),
      );

      const parsed: ParsedRow[] = rows
        .slice(1)
        .map((row) => {
          const areaName = String(row[areaIdx] ?? "").trim();
          const areaId = areaNameMap.get(areaName.toLowerCase()) ?? null;
          return {
            name: String(row[nameIdx] ?? "").trim(),
            qualification: String(row[qualIdx] ?? "").trim(),
            station: String(row[stationIdx] ?? "").trim(),
            specialization: String(row[specIdx] ?? "").trim(),
            areaName,
            areaId,
            mobileNumber:
              mobileIdx !== -1 ? String(row[mobileIdx] ?? "").trim() : "",
            dob: dobIdx !== -1 ? String(row[dobIdx] ?? "").trim() : "",
          };
        })
        .filter((r) => r.name);

      if (parsed.length === 0) {
        toast.error(
          "No valid rows found. Check that column headers match the expected format.",
        );
        return;
      }

      setParsedRows(parsed);
      toast.success(`Parsed ${parsed.length} row(s) from file.`);
    } catch (_err) {
      toast.error("Failed to parse file. Please check the file format.");
    } finally {
      setUploadParsing(false);
    }
  };

  const validRows = parsedRows.filter((r) => r.areaId !== null);
  const skippedCount = parsedRows.length - validRows.length;

  const isLoading = loadingDoctors || loadingAreas;

  const DoctorFormFields = ({
    form,
    setForm,
  }: { form: DoctorForm; setForm: (f: DoctorForm) => void }) => (
    <div className="space-y-4 py-2">
      <div>
        <Label htmlFor="doc-name">Name</Label>
        <Input
          id="doc-name"
          data-ocid="admin_doctors.input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Dr. Full Name"
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="doc-qual">Qualification</Label>
          <Input
            id="doc-qual"
            value={form.qualification}
            onChange={(e) =>
              setForm({ ...form, qualification: e.target.value })
            }
            placeholder="MBBS, MD..."
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="doc-spec">Specialization</Label>
          <Input
            id="doc-spec"
            value={form.specialization}
            onChange={(e) =>
              setForm({ ...form, specialization: e.target.value })
            }
            placeholder="Cardiologist..."
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="doc-station">Station</Label>
        <Input
          id="doc-station"
          value={form.station}
          onChange={(e) => setForm({ ...form, station: e.target.value })}
          placeholder="City / town"
          className="mt-1"
        />
      </div>
      <div>
        <Label>Area</Label>
        <Select
          value={form.areaId}
          onValueChange={(v) => setForm({ ...form, areaId: v })}
        >
          <SelectTrigger data-ocid="admin_doctors.select" className="mt-1">
            <SelectValue placeholder="Select area" />
          </SelectTrigger>
          <SelectContent>
            {(areas ?? []).map((a) => (
              <SelectItem key={a.id.toString()} value={a.id.toString()}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="doc-mobile">Mobile Number (Optional)</Label>
        <Input
          id="doc-mobile"
          type="tel"
          value={form.mobileNumber}
          onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
          placeholder="e.g. 9876543210"
          className="mt-1"
        />
        <div>
          <Label htmlFor="doc-dob">Date of Birth (Optional)</Label>
          <Input
            id="doc-dob"
            type="date"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div data-ocid="admin_doctors.section">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Doctor Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Add, edit or delete doctor records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ocid="admin_doctors.upload_button"
            variant="outline"
            className="border-[#0D5BA6] text-[#0D5BA6] hover:bg-blue-50 gap-2"
            onClick={() => {
              setParsedRows([]);
              setUploadOpen(true);
            }}
          >
            <Upload className="w-4 h-4" /> Upload from Excel
          </Button>
          <Button
            data-ocid="admin_doctors.open_modal_button"
            className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
            onClick={() => {
              setAddOpen(true);
              setAddForm(emptyForm);
            }}
          >
            <Plus className="w-4 h-4" /> Add Doctor
          </Button>
        </div>
      </div>

      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base font-semibold text-gray-800">
              All Doctors ({isLoading ? "..." : (doctors?.length ?? 0)})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" data-ocid="admin_doctors.loading_state">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : doctors?.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin_doctors.empty_state"
            >
              <p className="text-gray-400 text-sm">No doctors found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="admin_doctors.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors?.map((doc, idx) => (
                    <TableRow
                      key={doc.id.toString()}
                      data-ocid={`admin_doctors.item.${idx + 1}`}
                    >
                      <TableCell className="text-gray-500 text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {doc.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-purple-50 text-purple-700 text-xs"
                        >
                          {doc.qualification}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {doc.station}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {doc.specialization}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 text-xs"
                        >
                          {areaMap.get(doc.areaId.toString()) ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {doc.mobileNumber?.[0] ?? "—"}
                        <TableCell className="text-gray-600 text-sm">
                          {doc.dob?.[0] ?? "—"}
                        </TableCell>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin_doctors.edit_button.${idx + 1}`}
                            onClick={() => openEdit(doc)}
                            className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Pencil size={14} className="mr-1" /> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                data-ocid={`admin_doctors.delete_button.${idx + 1}`}
                                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 size={14} className="mr-1" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="admin_doctors.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Doctor
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{" "}
                                  <strong>{doc.name}</strong>? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="admin_doctors.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid="admin_doctors.confirm_button"
                                  onClick={() => deleteMutation.mutate(doc.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setAddForm(emptyForm);
        }}
      >
        <DialogContent data-ocid="admin_doctors.modal">
          <DialogHeader>
            <DialogTitle>Add Doctor</DialogTitle>
          </DialogHeader>
          <DoctorFormFields form={addForm} setForm={setAddForm} />
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_doctors.cancel_button"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_doctors.submit_button"
              disabled={
                addMutation.isPending || !addForm.name.trim() || !addForm.areaId
              }
              onClick={() => addMutation.mutate(addForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {addMutation.isPending ? "Adding..." : "Add Doctor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingDoctor}
        onOpenChange={(open) => !open && setEditingDoctor(null)}
      >
        <DialogContent data-ocid="admin_doctors.modal">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
          </DialogHeader>
          <DoctorFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_doctors.cancel_button"
              onClick={() => setEditingDoctor(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_doctors.save_button"
              disabled={updateMutation.isPending}
              onClick={() => {
                if (!editingDoctor) return;
                updateMutation.mutate({ id: editingDoctor.id, form: editForm });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(o) => {
          setUploadOpen(o);
          if (!o) {
            setParsedRows([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          data-ocid="admin_doctors.modal"
        >
          <DialogHeader>
            <DialogTitle>Bulk Upload Doctors from Excel</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <strong>Expected columns:</strong> Name, Qualification, Station,
              Specialization, Area, Mobile Number (optional), DOB (optional) —
              column headers are case-insensitive. Area must match an existing
              area name exactly.
            </div>

            <div>
              <Label htmlFor="bulk-file">
                Select Excel File (.xlsx / .xls)
              </Label>
              <input
                id="bulk-file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                data-ocid="admin_doctors.dropzone"
                className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-200 rounded-md p-1"
                onClick={(e) => {
                  // Reset value so re-selecting the same file triggers onChange
                  (e.currentTarget as HTMLInputElement).value = "";
                }}
                onChange={handleFileSelect}
              />
            </div>

            {uploadParsing && (
              <div
                className="flex items-center gap-2 text-sm text-gray-500"
                data-ocid="admin_doctors.loading_state"
              >
                <Loader2 className="h-4 w-4 animate-spin" /> Parsing file...
              </div>
            )}

            {parsedRows.length > 0 && (
              <>
                {skippedCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    ⚠️ <strong>{skippedCount} row(s)</strong> will be skipped due
                    to unmatched area names (highlighted in red below).
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <strong>{validRows.length}</strong> valid row(s) ready to
                  upload.
                </div>
                <div className="overflow-x-auto border rounded-lg max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Qualification</TableHead>
                        <TableHead>Station</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Mobile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row, idx) => (
                        <TableRow
                          // biome-ignore lint/suspicious/noArrayIndexKey: parsed rows have no stable id
                          key={`row-${idx}`}
                          className={row.areaId === null ? "bg-red-50" : ""}
                        >
                          <TableCell className="text-gray-500 text-xs">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-sm">{row.name}</TableCell>
                          <TableCell className="text-sm">
                            {row.qualification}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.station}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.specialization}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-sm ${
                                row.areaId === null
                                  ? "text-red-600 font-medium"
                                  : "text-green-700"
                              }`}
                            >
                              {row.areaName || "(blank)"}
                              {row.areaId === null && " ✗"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {row.mobileNumber || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_doctors.cancel_button"
              onClick={() => setUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_doctors.submit_button"
              disabled={bulkUploadMutation.isPending || validRows.length === 0}
              onClick={() => bulkUploadMutation.mutate(parsedRows)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {bulkUploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {bulkUploadMutation.isPending
                ? "Uploading..."
                : `Upload ${validRows.length} Doctor(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

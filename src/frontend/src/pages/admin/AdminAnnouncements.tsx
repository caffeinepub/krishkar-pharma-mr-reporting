import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit2,
  ImageIcon,
  Loader2,
  Megaphone,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";

type AnnouncementCategory =
  | { LatestProduct: null }
  | { UpcomingProduct: null }
  | { LatestScheme: null }
  | { NewGiftArticle: null };

interface AdminAnnouncement {
  id: bigint;
  title: string;
  body: string;
  category: AnnouncementCategory;
  createdAt: bigint;
  isActive: boolean;
  imageUrl: [] | [string];
}

const CATEGORIES = [
  {
    value: "LatestProduct",
    label: "Latest Product",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "UpcomingProduct",
    label: "Upcoming Products",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "LatestScheme",
    label: "Latest Scheme",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    value: "NewGiftArticle",
    label: "New Gift Article",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
];

function getCategoryLabel(cat: AnnouncementCategory): string {
  if ("LatestProduct" in cat) return "Latest Product";
  if ("UpcomingProduct" in cat) return "Upcoming Products";
  if ("LatestScheme" in cat) return "Latest Scheme";
  if ("NewGiftArticle" in cat) return "New Gift Article";
  return "Unknown";
}

function getCategoryColor(cat: AnnouncementCategory): string {
  if ("LatestProduct" in cat)
    return "bg-blue-100 text-blue-800 border-blue-200";
  if ("UpcomingProduct" in cat)
    return "bg-green-100 text-green-800 border-green-200";
  if ("LatestScheme" in cat)
    return "bg-orange-100 text-orange-800 border-orange-200";
  if ("NewGiftArticle" in cat)
    return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function formatDate(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface FormState {
  title: string;
  body: string;
  category: string;
  isActive: boolean;
  imageUrl: string;
}

const defaultForm: FormState = {
  title: "",
  body: "",
  category: "LatestProduct",
  isActive: true,
  imageUrl: "",
};

export default function AdminAnnouncements() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<AdminAnnouncement | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [imageMode, setImageMode] = useState<"url" | "upload">("upload");
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: announcements = [], isLoading } = useQuery<AdminAnnouncement[]>(
    {
      queryKey: ["allAnnouncements"],
      queryFn: async () => {
        if (!actor) return [];
        return (actor as any).getAllAnnouncements();
      },
      enabled: !!actor && !isFetching,
    },
  );

  const addMutation = useMutation({
    mutationFn: async (f: FormState) => {
      if (!actor) throw new Error("Not connected");
      const cat = { [f.category]: null } as AnnouncementCategory;
      const imageUrl: [] | [string] = f.imageUrl.trim()
        ? [f.imageUrl.trim()]
        : [];
      return (actor as any).adminAddAnnouncement(
        f.title,
        f.body,
        cat,
        imageUrl,
      );
    },
    onSuccess: () => {
      toast.success("Announcement added");
      queryClient.invalidateQueries({ queryKey: ["allAnnouncements"] });
      closeDialog();
    },
    onError: () => toast.error("Failed to add announcement"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: bigint; f: FormState }) => {
      if (!actor) throw new Error("Not connected");
      const cat = { [f.category]: null } as AnnouncementCategory;
      const imageUrl: [] | [string] = f.imageUrl.trim()
        ? [f.imageUrl.trim()]
        : [];
      return (actor as any).adminUpdateAnnouncement(
        id,
        f.title,
        f.body,
        cat,
        f.isActive,
        imageUrl,
      );
    },
    onSuccess: () => {
      toast.success("Announcement updated");
      queryClient.invalidateQueries({ queryKey: ["allAnnouncements"] });
      closeDialog();
    },
    onError: () => toast.error("Failed to update announcement"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).adminDeleteAnnouncement(id);
    },
    onSuccess: () => {
      toast.success("Announcement deleted");
      queryClient.invalidateQueries({ queryKey: ["allAnnouncements"] });
    },
    onError: () => toast.error("Failed to delete announcement"),
  });

  function openAdd() {
    setEditItem(null);
    setForm(defaultForm);
    setImageMode("upload");
    setShowDialog(true);
  }

  function openEdit(ann: AdminAnnouncement) {
    setEditItem(ann);
    const catKey = Object.keys(ann.category)[0];
    const existingImage = ann.imageUrl[0] ?? "";
    setForm({
      title: ann.title,
      body: ann.body,
      category: catKey,
      isActive: ann.isActive,
      imageUrl: existingImage,
    });
    // If existing image is a data URL or external URL, show url mode for editing
    setImageMode(existingImage ? "url" : "upload");
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditItem(null);
    setForm(defaultForm);
    setImageMode("upload");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm((p) => ({ ...p, imageUrl: dataUrl }));
      setUploadLoading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
      setUploadLoading(false);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, f: form });
    } else {
      addMutation.mutate(form);
    }
  }

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Announcements
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage admin messages shown to all users
            </p>
          </div>
        </div>
        <Button
          onClick={openAdd}
          data-ocid="announcements.open_modal_button"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Announcement
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Announcements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-12"
              data-ocid="announcements.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : announcements.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="announcements.empty_state"
            >
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No announcements yet. Add one to display messages to your team.
              </p>
            </div>
          ) : (
            <Table data-ocid="announcements.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((ann, idx) => (
                  <TableRow
                    key={ann.id.toString()}
                    data-ocid={`announcements.item.${idx + 1}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{ann.title}</p>
                        {ann.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {ann.body}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ann.imageUrl[0] ? (
                        <img
                          src={ann.imageUrl[0]}
                          alt=""
                          className="w-12 h-10 object-cover rounded border"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-10 rounded border bg-muted flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(
                          ann.category,
                        )}`}
                      >
                        {getCategoryLabel(ann.category)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ann.isActive ? "default" : "secondary"}>
                        {ann.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(ann.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(ann)}
                          data-ocid={`announcements.edit_button.${idx + 1}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(ann.id)}
                          data-ocid={`announcements.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" data-ocid="announcements.dialog">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Announcement" : "Add Announcement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Title *</Label>
              <Input
                id="ann-title"
                placeholder="e.g. New Product Launch: Kriscard-5 Plus"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                data-ocid="announcements.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-body">Message</Label>
              <Textarea
                id="ann-body"
                placeholder="Enter the announcement details..."
                rows={3}
                value={form.body}
                onChange={(e) =>
                  setForm((p) => ({ ...p, body: e.target.value }))
                }
                data-ocid="announcements.textarea"
              />
            </div>

            {/* Image section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Image{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageMode("upload")}
                    className={`px-2 py-0.5 rounded-full border text-xs transition-colors ${
                      imageMode === "upload"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-muted"
                    }`}
                  >
                    Upload from device
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={`px-2 py-0.5 rounded-full border text-xs transition-colors ${
                      imageMode === "url"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-muted"
                    }`}
                  >
                    Paste URL
                  </button>
                </div>
              </div>

              {imageMode === "upload" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {form.imageUrl?.startsWith("data:") ? (
                    <div className="relative">
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="w-full rounded-lg border object-contain"
                        style={{ maxHeight: 120 }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                        onClick={() => {
                          setForm((p) => ({ ...p, imageUrl: "" }));
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                    >
                      {uploadLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                      <span className="text-sm">
                        {uploadLoading
                          ? "Loading..."
                          : "Tap to choose image from device"}
                      </span>
                      <span className="text-xs text-muted-foreground/70">
                        JPG, PNG, GIF up to 2MB
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <Input
                    id="ann-image"
                    placeholder="https://example.com/image.jpg"
                    value={
                      form.imageUrl.startsWith("data:") ? "" : form.imageUrl
                    }
                    onChange={(e) =>
                      setForm((p) => ({ ...p, imageUrl: e.target.value }))
                    }
                  />
                  {form.imageUrl.trim() &&
                    !form.imageUrl.startsWith("data:") && (
                      <img
                        src={form.imageUrl.trim()}
                        alt="Preview"
                        className="w-full rounded-md border object-cover mt-2"
                        style={{ maxHeight: 80 }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                        onLoad={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "block";
                        }}
                      />
                    )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger data-ocid="announcements.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ann-active"
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, isActive: !!v }))
                }
                data-ocid="announcements.checkbox"
              />
              <Label htmlFor="ann-active" className="cursor-pointer">
                Active (visible to all users)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              data-ocid="announcements.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || uploadLoading}
              data-ocid="announcements.submit_button"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editItem ? "Save Changes" : "Add Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

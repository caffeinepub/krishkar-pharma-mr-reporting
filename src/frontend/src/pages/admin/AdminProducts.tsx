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
import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

interface ProductForm {
  name: string;
  code: string;
}

const emptyForm: ProductForm = { name: "", code: "" };

export default function AdminProducts() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<ProductForm>(emptyForm);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(emptyForm);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });

  const addMutation = useMutation({
    mutationFn: async (form: ProductForm) => {
      if (!actor) throw new Error("Not connected");
      await actor.addProduct(form.name, form.code);
    },
    onSuccess: () => {
      toast.success("Product added successfully!");
      setAddOpen(false);
      setAddForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to add product: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: bigint; form: ProductForm }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateProduct(id, form.name, form.code);
    },
    onSuccess: () => {
      toast.success("Product updated successfully!");
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to update product: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteProduct(id);
    },
    onSuccess: () => {
      toast.success("Product deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) =>
      toast.error(`Failed to delete product: ${err.message}`),
  });

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({ name: product.name, code: product.code });
  };

  return (
    <div data-ocid="admin_products.section">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Product Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Add, edit or delete products from the master list.
          </p>
        </div>
        <Button
          data-ocid="admin_products.open_modal_button"
          className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
          onClick={() => {
            setAddOpen(true);
            setAddForm(emptyForm);
          }}
        >
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <Card className="border border-[#E5EAF2] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base font-semibold text-gray-800">
              All Products ({isLoading ? "..." : (products?.length ?? 0)})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" data-ocid="admin_products.loading_state">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products?.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin_products.empty_state"
            >
              <p className="text-gray-400 text-sm">No products found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="admin_products.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product, idx) => (
                    <TableRow
                      key={product.id.toString()}
                      data-ocid={`admin_products.item.${idx + 1}`}
                    >
                      <TableCell className="text-gray-500 text-sm">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-green-50 text-green-700 text-xs font-mono"
                        >
                          {product.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin_products.edit_button.${idx + 1}`}
                            onClick={() => openEdit(product)}
                            className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Pencil size={14} className="mr-1" /> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                data-ocid={`admin_products.delete_button.${idx + 1}`}
                                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 size={14} className="mr-1" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="admin_products.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Product
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{" "}
                                  <strong>{product.name}</strong>? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="admin_products.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid="admin_products.confirm_button"
                                  onClick={() =>
                                    deleteMutation.mutate(product.id)
                                  }
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
        <DialogContent data-ocid="admin_products.modal">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="add-product-code">Product Code</Label>
              <Input
                id="add-product-code"
                data-ocid="admin_products.input"
                value={addForm.code}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, code: e.target.value }))
                }
                placeholder="e.g. KRC-001"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-product-name">Product Name</Label>
              <Input
                id="add-product-name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Kriscard-5"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_products.cancel_button"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_products.submit_button"
              disabled={
                addMutation.isPending ||
                !addForm.name.trim() ||
                !addForm.code.trim()
              }
              onClick={() => addMutation.mutate(addForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {addMutation.isPending ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <DialogContent data-ocid="admin_products.modal">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-product-code">Product Code</Label>
              <Input
                id="edit-product-code"
                data-ocid="admin_products.input"
                value={editForm.code}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, code: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-product-name">Product Name</Label>
              <Input
                id="edit-product-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="admin_products.cancel_button"
              onClick={() => setEditingProduct(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_products.save_button"
              disabled={updateMutation.isPending}
              onClick={() => {
                if (!editingProduct) return;
                updateMutation.mutate({
                  id: editingProduct.id,
                  form: editForm,
                });
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
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend";
import { useActor } from "../hooks/useActor";

const SEED_PRODUCTS = [
  { code: "KRC5", name: "Kriscard-5" },
  { code: "KRF400", name: "Krishnifen 400" },
  { code: "KRGEL", name: "Krishgel Cream" },
  { code: "KRTS", name: "Kristal Syrup" },
];

export default function Products() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [pName, setPName] = useState("");
  const [pCode, setPCode] = useState("");
  const [seeded, setSeeded] = useState(false);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });

  // Seed products if none exist
  useEffect(() => {
    if (!actor || isFetching || seeded || isLoading) return;
    if (products.length === 0) {
      setSeeded(true);
      Promise.all(SEED_PRODUCTS.map((p) => actor.addProduct(p.name, p.code)))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          toast.success("Seed products added");
        })
        .catch(() => {});
    }
  }, [actor, isFetching, products, seeded, isLoading, queryClient]);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addProduct(pName.trim(), pCode.trim().toUpperCase());
    },
    onSuccess: () => {
      toast.success("Product added");
      setPName("");
      setPCode("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Failed to add product"),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Product Master
          </h2>
          <p className="text-sm text-gray-500">
            {products.length} products registered
          </p>
        </div>
        <Button
          data-ocid="products.open_modal_button"
          className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              New Product
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Product Code
                </Label>
                <Input
                  data-ocid="products.code.input"
                  value={pCode}
                  onChange={(e) => setPCode(e.target.value)}
                  placeholder="e.g. KRC5"
                  className="border-[#E5EAF2]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">
                  Product Name
                </Label>
                <Input
                  data-ocid="products.name.input"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Kriscard-5"
                  className="border-[#E5EAF2]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                data-ocid="products.submit_button"
                className="bg-[#0D5BA6] hover:bg-[#0a4f96] text-white"
                onClick={() => addMutation.mutate()}
                disabled={
                  addMutation.isPending || !pName.trim() || !pCode.trim()
                }
              >
                {addMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Product"
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
        <CardHeader className="border-b border-[#F1F5F9] pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-gray-700">
              Company Products
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="flex justify-center py-12"
              data-ocid="products.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div data-ocid="products.empty_state" className="text-center py-12">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No products added yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8FAFC]">
                  <TableHead className="text-xs font-semibold text-gray-500 w-16">
                    #
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Product Code
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">
                    Product Name
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p, idx) => (
                  <TableRow
                    key={String(p.id)}
                    data-ocid={`products.item.${idx + 1}`}
                    className="hover:bg-[#F8FAFC]"
                  >
                    <TableCell className="text-xs text-gray-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-50 text-blue-700 border-0 font-mono text-xs">
                        {p.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700">
                      {p.name}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

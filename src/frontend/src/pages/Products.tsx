import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import type { Product } from "../backend";
import { useActor } from "../hooks/useActor";

export default function Products() {
  const { actor, isFetching } = useActor();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => actor!.getAllProducts(),
    enabled: !!actor && !isFetching,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-400">All available products</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-16 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl">
          <CardContent className="text-center py-12">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No products available</p>
            <p className="text-gray-400 text-sm mt-1">
              Products are managed by the Admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="bg-white border border-[#E5EAF2] shadow-sm rounded-xl hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  {product.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-500">
                  Code:{" "}
                  <span className="font-mono font-medium text-gray-700">
                    {product.code}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

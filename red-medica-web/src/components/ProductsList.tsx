import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { simpleBlockchainService } from '@/services/simple-blockchain';

export const ProductsList = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadProducts = () => {
      const allProducts = simpleBlockchainService.getProducts();
      setProducts(allProducts);
    };

    loadProducts();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadProducts, 5000);
    return () => clearInterval(interval);
  }, []);

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No products registered yet. Register your first product!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Registered Products</h3>
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{product.name}</span>
              <Badge variant="outline">ID: {product.id}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Batch:</strong> {product.batchNumber}
              </div>
              <div>
                <strong>Category:</strong> {product.category}
              </div>
              <div>
                <strong>Quantity:</strong> {product.quantity}
              </div>
              <div>
                <strong>Manufacturer:</strong> {product.manufacturerName}
              </div>
              <div className="col-span-2">
                <strong>Transaction:</strong> 
                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  {product.txHash.slice(0, 20)}...
                </code>
              </div>
              <div className="col-span-2 text-xs text-gray-500">
                Registered: {new Date(product.timestamp).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
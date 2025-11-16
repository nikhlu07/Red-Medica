import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { useBlockchain } from '@/hooks/useBlockchain';
import { ArrowRight, Loader2, CheckCircle2, ArrowLeftRight, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Product } from '@/types/blockchain';

const Transfer = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { blockchainUser, isAuthenticated } = useAppStore();
  const { verifyProduct, transferCustody, isConnected, networkInfo } = useBlockchain();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transferResult, setTransferResult] = useState<{
    txHash?: string;
    message?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    recipientAddress: '',
    location: '',
    notes: '',
    confirmed: false,
  });

  // Load product details on mount
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId || !isConnected) {
        setIsLoading(false);
        return;
      }

      try {
        const numericProductId = parseInt(productId);
        if (isNaN(numericProductId)) {
          throw new Error('Invalid product ID');
        }

        const productData = await verifyProduct(numericProductId);
        if (!productData) {
          throw new Error('Product not found');
        }

        setProduct(productData);
      } catch (error) {
        console.error('Failed to load product:', error);
        toast.error('Failed to load product details');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId, isConnected, verifyProduct, navigate]);

  if (!isAuthenticated || !blockchainUser) {
    return <Navigate to="/connect" replace />;
  }

  if (blockchainUser.role !== 'manufacturer') {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto max-w-4xl px-4 pt-28 pb-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Product</h2>
              <p className="text-gray-600">Fetching product information...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.confirmed) {
      toast.error('Please confirm the transfer');
      return;
    }

    if (!formData.recipientAddress.trim()) {
      toast.error('Please enter recipient address');
      return;
    }

    if (!formData.location.trim()) {
      toast.error('Please enter transfer location');
      return;
    }

    if (!isConnected) {
      toast.error('Not connected to blockchain network');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await transferCustody(
        product.id,
        formData.recipientAddress.trim(),
        formData.location.trim()
      );

      if (result.success) {
        setTransferResult({
          txHash: result.txHash,
          message: result.message
        });
        setShowSuccess(true);
        toast.success('Transfer Successful', {
          description: result.message || 'Custody has been transferred successfully',
        });
      } else {
        toast.error('Transfer Failed', {
          description: result.error || 'Failed to transfer custody',
        });
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Transfer Error', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        body {
            font-family: 'Inter', sans-serif;
            background: #F7FAFC;
            color: #1a202c;
        }
        .card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            transition: all 0.3s ease;
            border-radius: 0.75rem;
        }
        .card:hover {
            border-color: #3B82F6;
            transform: translateY(-5px);
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
        }
        .cta-gradient {
            background: linear-gradient(90deg, #3B82F6, #2563EB);
            color: white;
            transition: opacity 0.3s ease;
        }
        .cta-gradient:hover {
            opacity: 0.9;
        }
        ::selection {
            background-color: #3B82F6;
            color: white;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />

        <main className="container mx-auto max-w-4xl px-4 pt-28 pb-8">
          {/* Network Status Alert */}
          {!isConnected && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Network Disconnected:</strong> You must be connected to the blockchain network to transfer custody.
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex rounded-full bg-blue-100 p-4">
                <ArrowLeftRight className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 md:text-6xl">
              Transfer Custody
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Securely transfer product ownership on the blockchain.
            </p>
          </div>

          {/* Product Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Product Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-600">Product ID</dt>
                  <dd className="font-semibold text-gray-900">#{product.id}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Product Name</dt>
                  <dd className="font-semibold text-gray-900">{product.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Batch Number</dt>
                  <dd className="font-semibold text-gray-900">{product.batchNumber}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Category</dt>
                  <dd className="font-semibold text-gray-900">{product.category}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Current Holder</dt>
                  <dd className="font-mono text-xs text-gray-800">
                    {product.currentHolder.slice(0, 8)}...{product.currentHolder.slice(-8)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Manufacturer</dt>
                  <dd className="font-semibold text-gray-900">{product.manufacturerName}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Transfer Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Transfer Details</CardTitle>
              <CardDescription className="text-gray-600">Enter recipient information for blockchain transfer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recipient Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Recipient Information</h3>
                <div>
                  <Label htmlFor="address" className="font-medium text-gray-700">Recipient Wallet Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter the recipient's blockchain wallet address"
                    value={formData.recipientAddress}
                    onChange={(e) => updateField('recipientAddress', e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This should be a valid Polkadot/Substrate address
                  </p>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Transfer Details</h3>
                <div>
                  <Label htmlFor="location" className="font-medium text-gray-700">Transfer Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New Delhi, India"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Location where the transfer is taking place
                  </p>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <Label htmlFor="notes" className="font-medium text-gray-700">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about the transfer..."
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Confirmation */}
              <div className="space-y-4 rounded-lg border bg-blue-50 p-4">
                <h3 className="text-lg font-semibold text-gray-800">Confirmation</h3>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.confirmed}
                    onChange={(e) => updateField('confirmed', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">I confirm that:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>All information provided is accurate</li>
                      <li>I am authorized to transfer this product</li>
                      <li>The recipient address is correct and verified</li>
                      <li>This transfer will be recorded permanently on the blockchain</li>
                    </ul>
                  </div>
                </label>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Transfer timestamp: {new Date().toLocaleString()}</p>
                  <p>Network: {networkInfo?.chainName || 'Polkadot Network'}</p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.confirmed || !formData.recipientAddress.trim() || !formData.location.trim() || !isConnected}
                className="w-full cta-gradient font-semibold"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Transfer on Blockchain...
                  </>
                ) : !isConnected ? (
                  'Blockchain Disconnected'
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Transfer Custody on Blockchain
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </main>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl font-bold text-gray-900">Transfer Successful!</DialogTitle>
              <DialogDescription className="text-center text-gray-600">
                Product custody has been transferred on the blockchain.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {transferResult?.txHash && (
                <div className="rounded-lg border bg-gray-100 p-4">
                  <div className="mb-2 text-sm font-medium text-gray-600">Transaction Hash</div>
                  <div className="break-all font-mono text-xs text-gray-800 mb-2">
                    {transferResult.txHash}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      const explorerUrl = `https://moonbase.moonscan.io/tx/${transferResult.txHash}`;
                      window.open(explorerUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on Explorer
                  </Button>
                </div>
              )}
              
              {transferResult?.message && (
                <div className="rounded-lg border bg-blue-50 p-4">
                  <div className="mb-2 text-sm font-medium text-blue-800">Message</div>
                  <div className="text-sm text-blue-700">{transferResult.message}</div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 font-medium text-gray-700 hover:text-blue-500 hover:bg-gray-100 hover:border-blue-500"
                  onClick={() => navigate('/dashboard')}
                >
                  View Dashboard
                </Button>
                <Button
                  className="cta-gradient flex-1 font-semibold"
                  onClick={() => navigate(`/products/${productId}`)}
                >
                  View Product
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </>
  );
};

export default Transfer;

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useQRCode } from '@/hooks/useQRCode';
import {
  Package,
  MapPin,
  Calendar,
  Thermometer,
  Download,
  Share2,
  ArrowRight,
  CheckCircle2,
  Building2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Clock,
  Shield,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { Product, Transfer } from '@/types/blockchain';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { blockchainUser, isAuthenticated } = useAppStore();
  const { verifyProduct, getTransferHistory, isConnected, networkInfo } = useBlockchain();
  const { generateQRCode } = useQRCode();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadProductDetails = async () => {
      if (!id || !isConnected) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Convert ID to number
        const productId = parseInt(id);
        if (isNaN(productId)) {
          throw new Error('Invalid product ID');
        }

        // Load product details
        const productData = await verifyProduct(productId);
        if (!productData) {
          throw new Error('Product not found');
        }

        setProduct(productData);

        // Load transfer history
        try {
          const transferHistory = await getTransferHistory(productId);
          setTransfers(transferHistory);
        } catch (transferError) {
          console.warn('Failed to load transfer history:', transferError);
          // Don't fail the whole page if transfers can't be loaded
          setTransfers([]);
        }

        // Generate QR code
        try {
          const qrUrl = await generateQRCode(
            productId.toString(),
            productData.batchNumber,
            productData.manufacturerName
          );
          setQrCodeUrl(qrUrl);
        } catch (qrError) {
          console.warn('Failed to generate QR code:', qrError);
        }

      } catch (error) {
        console.error('Failed to load product details:', error);
        setError(error instanceof Error ? error.message : 'Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    loadProductDetails();
  }, [id, isConnected, verifyProduct, getTransferHistory, generateQRCode]);

  if (!isAuthenticated || !blockchainUser) {
    return <Navigate to="/connect" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto max-w-7xl px-4 pt-28 pb-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Product Details</h2>
              <p className="text-gray-600">Fetching product information from blockchain...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto max-w-7xl px-4 pt-28 pb-8">
          <Alert className="max-w-2xl mx-auto border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Product Not Found:</strong> {error || 'The requested product could not be found.'}
            </AlertDescription>
          </Alert>
          <div className="text-center mt-8">
            <Link to="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const daysUntilExpiry = Math.floor(
    (new Date(product.expiryDate * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <style>{`
        body {
            font-family: 'Inter', sans-serif;
            background: #F7FAFC;
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
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Navbar />

        <main className="container mx-auto max-w-7xl px-4 pt-28 pb-8">
          {/* Network Status Alert */}
          {!isConnected && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Network Disconnected:</strong> Some product information may not be up to date.
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex rounded-full bg-blue-100 p-4">
              <Package className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 md:text-6xl">
              {product.name}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-lg text-gray-600">
              Product ID: #{product.id} • Batch: {product.batchNumber}
            </p>
            
            {/* Connection Status */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Live Data' : 'Cached Data'}
                </span>
              </div>
              {networkInfo?.chainName && (
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">{networkInfo.chainName}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mb-8 flex justify-center gap-2">
            {blockchainUser.role === 'manufacturer' && (
              <Link to={`/transfer/${product.id}`}>
                <Button className="cta-gradient font-semibold" disabled={!isConnected}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Transfer Custody
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              className="font-medium text-gray-700 hover:text-blue-500 hover:bg-gray-100 hover:border-blue-500"
              onClick={() => {
                // Generate a simple product report
                const reportData = {
                  productId: product.id,
                  productName: product.name,
                  batchNumber: product.batchNumber,
                  manufacturer: product.manufacturerName,
                  mfgDate: new Date(product.mfgDate * 1000).toISOString(),
                  expiryDate: new Date(product.expiryDate * 1000).toISOString(),
                  category: product.category,
                  quantity: product.quantity,
                  isAuthentic: product.isAuthentic,
                  currentHolder: product.currentHolder,
                  transferCount: transfers.length,
                  reportGeneratedAt: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
                  type: 'application/json' 
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `product-report-${product.id}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                toast.success('Report Downloaded');
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="font-medium text-gray-700 hover:text-blue-500 hover:bg-gray-100 hover:border-blue-500"
              onClick={() => {
                const shareUrl = `${window.location.origin}/verify?id=${product.id}`;
                navigator.clipboard.writeText(shareUrl);
                toast.success('Verification link copied to clipboard');
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column */}
            <div className="space-y-8 lg:col-span-2">
              {/* Manufacturing Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Manufacturing Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Manufacturer</dt>
                      <dd className="mt-1 flex items-center gap-2 font-semibold text-gray-900">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        {product.manufacturerName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Manufacturer Address</dt>
                      <dd className="mt-1 font-mono text-sm text-gray-700">
                        {product.manufacturer.slice(0, 8)}...{product.manufacturer.slice(-8)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Manufacturing Date</dt>
                      <dd className="mt-1 font-semibold text-gray-900">
                        {new Date(product.mfgDate * 1000).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Expiry Date</dt>
                      <dd className="mt-1 font-semibold text-gray-900">
                        {new Date(product.expiryDate * 1000).toLocaleDateString()}
                        <span className={`ml-2 text-xs font-bold ${daysUntilExpiry < 30 ? 'text-red-500' : daysUntilExpiry < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ({daysUntilExpiry < 0 ? 'EXPIRED' : `${daysUntilExpiry} days left`})
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Batch Quantity</dt>
                      <dd className="mt-1 font-semibold text-gray-900">{product.quantity.toLocaleString()} units</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Category</dt>
                      <dd className="mt-1 font-semibold text-gray-900">{product.category}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Registration Date</dt>
                      <dd className="mt-1 font-semibold text-gray-900">
                        {new Date(product.createdAt * 1000).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Authenticity Status</dt>
                      <dd className="mt-1 flex items-center gap-2">
                        {product.isAuthentic ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-600">Verified Authentic</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="font-semibold text-red-600">Not Verified</span>
                          </>
                        )}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Current Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-600">Blockchain Status</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">On-Chain</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-600">Current Holder</span>
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono text-gray-800">
                      {product.currentHolder.slice(0, 8)}...{product.currentHolder.slice(-8)}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-600">Transfer Count</span>
                    <span className="font-semibold text-gray-900">{transfers.length} transfers</span>
                  </div>
                  {transfers.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-600">Last Transfer</span>
                        <span className="flex items-center gap-1 font-semibold text-gray-900">
                          <Clock className="h-5 w-5 text-blue-500" />
                          {new Date(transfers[transfers.length - 1].timestamp * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-600">Last Location</span>
                        <span className="flex items-center gap-1 font-semibold text-gray-900">
                          <MapPin className="h-5 w-5 text-blue-500" />
                          {transfers[transfers.length - 1].location || 'Not specified'}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* QR Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">QR Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    {qrCodeUrl ? (
                      <img 
                        src={qrCodeUrl} 
                        alt="Product QR Code" 
                        className="mb-4 rounded-lg border border-gray-200 w-48 h-48"
                      />
                    ) : (
                      <div className="mb-4 w-48 h-48 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Generating QR Code...</p>
                        </div>
                      </div>
                    )}
                    <p className="mb-4 text-center text-sm text-gray-600">
                      Scan to verify product authenticity
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full font-medium text-gray-700 hover:text-blue-500 hover:bg-gray-100 hover:border-blue-500"
                      disabled={!qrCodeUrl}
                      onClick={() => {
                        if (qrCodeUrl) {
                          const link = document.createElement('a');
                          link.href = qrCodeUrl;
                          link.download = `qr-code-product-${product.id}.png`;
                          link.click();
                          toast.success('QR Code Downloaded');
                        }
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Product ID */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Product Identification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 text-sm font-medium text-gray-600">Product ID</div>
                    <div className="rounded-lg bg-gray-100 p-3 font-mono text-sm font-semibold text-gray-800">
                      #{product.id}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-medium text-gray-600">Verification URL</div>
                    <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 break-all">
                      {window.location.origin}/verify?id={product.id}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Checks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Safety Checks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {product.isAuthentic ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-800">
                        {product.isAuthentic ? 'Verified authentic' : 'Authenticity not verified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {daysUntilExpiry > 0 ? (
                        <CheckCircle2 className={`h-5 w-5 ${daysUntilExpiry > 30 ? 'text-green-600' : 'text-yellow-500'}`} />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-800">
                        {daysUntilExpiry > 30 ? 'Not expired' : daysUntilExpiry > 0 ? 'Expiring soon' : 'EXPIRED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-800">Blockchain verified</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-800">
                        {transfers.length > 0 ? `${transfers.length} transfers recorded` : 'No transfers yet'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Supply Chain History (Full Width) */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Supply Chain History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-6">
                    {/* Manufacturing Event */}
                    <div className="relative flex gap-4 pb-6">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-blue-500 p-2 text-white">
                          <Package className="h-5 w-5" />
                        </div>
                        {transfers.length > 0 && (
                          <div className="mt-2 h-full w-0.5 bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">Product Manufactured</div>
                        <div className="mb-2 text-sm text-gray-600">
                          by {product.manufacturerName}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(product.mfgDate * 1000).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            Registered on blockchain
                          </span>
                        </div>
                        <code className="mt-2 block text-xs font-mono text-gray-500 break-all">
                          Manufacturer: {product.manufacturer.slice(0, 16)}...{product.manufacturer.slice(-16)}
                        </code>
                      </div>
                    </div>

                    {/* Transfer Events */}
                    {transfers.length > 0 ? (
                      transfers.map((transfer, index) => (
                        <div key={index} className="relative flex gap-4 pb-6">
                          <div className="flex flex-col items-center">
                            <div className={`rounded-full p-2 text-white ${transfer.verified ? 'bg-green-600' : 'bg-yellow-500'}`}>
                              <ArrowRight className="h-5 w-5" />
                            </div>
                            {index < transfers.length - 1 && (
                              <div className="mt-2 h-full w-0.5 bg-gray-200" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900">
                              Custody Transfer #{index + 1}
                            </div>
                            <div className="mb-2 text-sm text-gray-600">
                              From: {transfer.from.slice(0, 8)}...{transfer.from.slice(-8)} → 
                              To: {transfer.to.slice(0, 8)}...{transfer.to.slice(-8)}
                            </div>
                            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              {transfer.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {transfer.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(transfer.timestamp * 1000).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                {transfer.verified ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                )}
                                {transfer.verified ? 'Verified' : 'Pending verification'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No transfers recorded yet</p>
                        <p className="text-sm">Product is still with the original manufacturer</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Blockchain Details (Full Width) */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Blockchain Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="font-medium text-gray-600">Product ID</dt>
                      <dd className="font-mono text-gray-800">#{product.id}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-medium text-gray-600">Network</dt>
                      <dd className="font-semibold text-gray-800">
                        {networkInfo?.chainName || 'Polkadot Network'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-medium text-gray-600">Current Block</dt>
                      <dd className="font-mono text-gray-800">
                        {networkInfo?.blockNumber?.toLocaleString() || 'Loading...'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-medium text-gray-600">Registration Time</dt>
                      <dd className="font-semibold text-gray-800">
                        {new Date(product.createdAt * 1000).toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-medium text-gray-600">Contract Address</dt>
                      <dd className="font-mono text-gray-800 break-all">
                        {import.meta.env.VITE_CONTRACT_ADDRESS || 'Not available'}
                      </dd>
                    </div>
                    {networkInfo?.chainName && (
                      <div className="pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // This would open a blockchain explorer - network specific
                            const explorerUrl = `https://moonbase.moonscan.io/address/${import.meta.env.VITE_CONTRACT_ADDRESS}`;
                            window.open(explorerUrl, '_blank');
                          }}
                          className="w-full"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View on Explorer
                        </Button>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProductDetails;

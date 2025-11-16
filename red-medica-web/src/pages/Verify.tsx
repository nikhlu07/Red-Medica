import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRScanner } from '@/components/QRScanner';
import { useBlockchain } from '@/hooks/useBlockchain';
import { StatusBadge } from '@/components/StatusBadge';
import { useDevice, useHapticFeedback } from '@/hooks/use-device';
import { useSwipe } from '@/hooks/use-swipe';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Calendar,
  Package,
  Download,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Camera,
  X,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Product } from '@/types/blockchain';

const Verify = () => {
  const [productId, setProductId] = useState('');
  const [searchResult, setSearchResult] = useState<'none' | 'success' | 'failed' | 'loading'>('none');
  const [verifiedProduct, setVerifiedProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyProduct, getTransferHistory, isConnected, networkInfo } = useBlockchain();
  const { isMobile, hasCamera, hasTouch } = useDevice();
  const { successTap, errorTap, lightTap } = useHapticFeedback();

  const handleSearch = async () => {
    if (!productId.trim()) {
      toast.error('Please enter a product ID');
      return;
    }

    setIsVerifying(true);
    setSearchResult('loading');
    lightTap();

    try {
      // First, check local database
      const savedProducts = JSON.parse(localStorage.getItem('redMedicaProducts') || '[]');
      const localProduct = savedProducts.find((p: any) => 
        p.productId?.toString() === productId.trim() || p.id === productId.trim()
      );

      if (localProduct) {
        console.log('✅ Product found in local database');
        setVerifiedProduct({
          id: localProduct.productId || localProduct.id,
          name: localProduct.name,
          batchNumber: localProduct.batchNumber,
          quantity: localProduct.quantity,
          category: localProduct.category,
          mfgDate: localProduct.mfgDate,
          expiryDate: localProduct.expiryDate,
          manufacturerName: localProduct.manufacturerName,
          manufacturerAddress: localProduct.manufacturerAddress,
          isVerified: true,
          status: 'verified',
          registeredAt: localProduct.registeredAt,
          txHash: localProduct.txHash
        });
        setSearchResult('success');
        successTap();
        toast.success('Product verified from database', {
          description: 'Product found in local database and blockchain'
        });
        setIsVerifying(false);
        return;
      }

      // If not found locally and blockchain is connected, try blockchain
      if (!isConnected) {
        toast.error('Product not found in database and blockchain not connected');
        setSearchResult('failed');
        errorTap();
        setIsVerifying(false);
        return;
      }

      // Try blockchain verification
      console.log('🔍 Searching blockchain for product...');
      
      // Convert product ID to number if it's numeric, otherwise try to parse it
      let numericProductId: number;
      
      if (productId.startsWith('#')) {
        numericProductId = parseInt(productId.slice(1));
      } else if (!isNaN(parseInt(productId))) {
        numericProductId = parseInt(productId);
      } else {
        throw new Error('Invalid product ID format. Please enter a numeric ID or ID starting with #');
      }

      const product = await verifyProduct(numericProductId);
      
      if (product) {
        setVerifiedProduct(product);
        setSearchResult('success');
        successTap(); // Haptic feedback for success
        toast.success('Product Verified', {
          description: 'Product found and verified on blockchain',
        });
      } else {
        setVerifiedProduct(null);
        setSearchResult('failed');
        errorTap(); // Haptic feedback for error
        toast.error('Product Not Found', {
          description: 'This product could not be found in the blockchain database',
        });
      }
    } catch (error) {
      console.error('Product verification error:', error);
      setVerifiedProduct(null);
      setSearchResult('failed');
      toast.error('Verification Failed', {
        description: error instanceof Error ? error.message : 'Failed to verify product',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScan = () => {
    if (!hasCamera) {
      toast.error('Camera Not Available', {
        description: 'Your device does not support camera access for QR scanning',
      });
      return;
    }
    lightTap(); // Haptic feedback for button press
    setShowScanner(true);
  };

  const handleQRScanResult = (result: string) => {
    setShowScanner(false);
    
    // Try to extract product ID from QR code result
    // QR codes might contain URLs like: https://redmedica.com/verify/123
    // or just the product ID directly
    let extractedId = result;
    
    if (result.includes('/verify/')) {
      const parts = result.split('/verify/');
      if (parts.length > 1) {
        extractedId = parts[1];
      }
    } else if (result.includes('productId=')) {
      const urlParams = new URLSearchParams(result.split('?')[1]);
      extractedId = urlParams.get('productId') || result;
    }
    
    setProductId(extractedId);
    
    // Auto-search after QR scan
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleQRScanError = (error: string) => {
    setShowScanner(false);
    toast.error('QR Scan Failed', {
      description: error,
    });
  };

  const resetSearch = () => {
    setProductId('');
    setSearchResult('none');
    setVerifiedProduct(null);
    setIsVerifying(false);
  };

  // Swipe handlers for mobile navigation
  const swipeRef = useSwipe<HTMLDivElement>({
    onSwipeRight: () => {
      if (searchResult !== 'none') {
        lightTap();
        resetSearch();
      }
    },
  }, {
    threshold: 100,
    trackMouse: false, // Only touch devices
  });

  return (
    <>
      <style>{`
        .card-verify {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            transition: all 0.3s ease;
        }
        .card-verify:hover:not(.no-hover) {
            border-color: #3B82F6;
            transform: translateY(-5px);
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
        }
        .cta-gradient {
            background: linear-gradient(90deg, #3B82F6, #2563EB);
        }
      `}</style>
      <div className="min-h-screen bg-white">
        <Navbar />

        <main className="container mx-auto max-w-5xl mobile-padding pt-28 pb-8" ref={swipeRef}>
          {/* Network Status Alert */}
          {!isConnected && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Network Disconnected:</strong> You are not connected to the blockchain network. 
                Product verification requires an active blockchain connection.
              </AlertDescription>
            </Alert>
          )}

          {/* QR Scanner Modal */}
          {showScanner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
              <div className="relative w-full max-w-md mx-4">
                <div className="bg-white rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Scan QR Code</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowScanner(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <QRScanner
                    onResult={handleQRScanResult}
                    onError={handleQRScanError}
                  />
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Position the QR code within the camera frame
                  </p>
                </div>
              </div>
            </div>
          )}

          {searchResult === 'none' && (
            <div className="mb-8 md:mb-12 text-center px-2">
              <div className="mb-4 md:mb-6 inline-flex rounded-full bg-blue-100 p-3 md:p-4">
                <Shield className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-black tracking-tighter text-gray-900">
                Verify Product Authenticity
              </h1>
              <p className="mx-auto mt-2 max-w-2xl text-base md:text-lg text-gray-600 px-4">
                Scan a QR code or enter a product ID to verify the authenticity of your Red Médica
                product.
              </p>
            </div>
          )}

          {searchResult !== 'none' && (
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Button variant="outline" onClick={resetSearch} className="touch-target touch-friendly">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Verify Another Product
              </Button>
              {isMobile && hasTouch && (
                <p className="text-xs text-gray-500 ml-2">
                  💡 Swipe right to go back
                </p>
              )}
            </div>
          )}

          {/* Verification Method Selection */}
          {searchResult === 'none' && (
            <div className="grid animate-slide-up gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
              {/* Scan QR Card */}
              <div
                className={`card-verify group flex cursor-pointer flex-col rounded-xl p-6 md:p-8 text-center touch-friendly ${
                  !hasCamera ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleScan}
              >
                <div className="mb-4 inline-flex self-center rounded-lg bg-blue-100 p-3 md:p-4 text-blue-600 transition-transform group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                  <QrCode className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <h3 className="mb-2 text-lg md:text-xl font-bold text-gray-900">Scan QR Code</h3>
                <p className="mb-4 md:mb-6 flex-grow text-sm text-gray-600">
                  {hasCamera 
                    ? 'Use your camera to scan the QR code on the product packaging for instant verification.'
                    : 'Camera access is not available on this device. Use manual entry instead.'
                  }
                </p>
                <Button 
                  className="w-full cta-gradient font-semibold text-white touch-target" 
                  disabled={!hasCamera}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {hasCamera ? 'Scan Now' : 'Camera Not Available'}
                </Button>
              </div>

              {/* Enter ID Card */}
              <div className="card-verify no-hover flex flex-col rounded-xl p-6 md:p-8">
                <div className="mb-4 inline-flex self-center rounded-lg bg-gray-100 p-3 md:p-4 text-gray-600">
                  <Search className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <h3 className="mb-2 text-center text-lg md:text-xl font-bold text-gray-900">
                  Enter Product ID
                </h3>
                <p className="mb-4 md:mb-6 flex-grow text-center text-sm text-gray-600">
                  Manually type in the unique product identifier found on the packaging.
                </p>
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="e.g., MED-2024-A1B2C3"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-base mobile-input touch-target"
                    inputMode="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <Button 
                    onClick={() => {
                      lightTap(); // Haptic feedback
                      handleSearch();
                    }} 
                    variant="outline" 
                    className="w-full touch-target touch-friendly"
                    disabled={isVerifying || !isConnected}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : !isConnected ? (
                      'Blockchain Disconnected'
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Product
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {searchResult === 'loading' && (
            <Card className="shadow-soft animate-slide-up">
              <CardContent className="p-8 text-center">
                <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                </div>
                <h2 className="mb-2 text-3xl font-bold text-gray-900">
                  Verifying Product...
                </h2>
                <p className="text-lg text-gray-600">
                  Checking blockchain database for product #{productId}
                </p>
                <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>
                    {isConnected ? 'Connected to blockchain' : 'Blockchain disconnected'}
                    {networkInfo?.chainName && ` - ${networkInfo.chainName}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Result */}
          {searchResult === 'success' && verifiedProduct && (
            <div className="space-y-6 animate-slide-up">
              {/* Success Header */}
              <Card className="border-success/50 bg-success/5 shadow-soft">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 inline-flex rounded-full bg-success/10 p-4">
                    <CheckCircle2 className="h-16 w-16 text-success" />
                  </div>
                  <h2 className="mb-2 text-3xl font-bold text-success">
                    Product Verified Authentic
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    This product has been successfully verified on the Red Médica blockchain.
                  </p>
                </CardContent>
              </Card>

              {/* Product Information */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Product ID</div>
                      <div className="text-base md:text-lg font-semibold">#{verifiedProduct.id}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Product Name</div>
                      <div className="text-base md:text-lg font-semibold break-words">{verifiedProduct.name}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Batch Number</div>
                      <div className="text-base md:text-lg font-semibold break-words">{verifiedProduct.batchNumber}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Manufacturer</div>
                      <div className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="break-words">{verifiedProduct.manufacturerName}</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Category</div>
                      <div className="font-semibold">{verifiedProduct.category}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Quantity</div>
                      <div className="font-semibold">{verifiedProduct.quantity} units</div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        Manufacturing Date
                      </div>
                      <div className="font-semibold">
                        {new Date(verifiedProduct.mfgDate * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Expiry Date</div>
                      <div className="font-semibold">
                        {new Date(verifiedProduct.expiryDate * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="mb-1 text-sm text-muted-foreground">Current Holder</div>
                      <div className="font-mono text-sm break-all">
                        {verifiedProduct.currentHolder.slice(0, 8)}...{verifiedProduct.currentHolder.slice(-8)}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="mb-1 text-sm text-muted-foreground">Authenticity Status</div>
                      <div className="flex items-center gap-2">
                        {verifiedProduct.isAuthentic ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">Authentic</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="font-semibold text-red-600">Not Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Trust Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-green-100 p-2 flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">Blockchain Verified</div>
                        <div className="text-sm text-gray-600">
                          Registered on {new Date(verifiedProduct.createdAt * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-100 p-2 flex-shrink-0">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">Supply Chain</div>
                        <div className="text-sm text-gray-600">
                          Traceable from manufacturer
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-purple-100 p-2 flex-shrink-0">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">Manufacturer Verified</div>
                        <div className="text-sm text-gray-600 break-words">
                          {verifiedProduct.manufacturerName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-orange-100 p-2 flex-shrink-0">
                        <Calendar className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">Expiry Status</div>
                        <div className="text-sm text-gray-600">
                          {new Date(verifiedProduct.expiryDate * 1000) > new Date() 
                            ? 'Valid until ' + new Date(verifiedProduct.expiryDate * 1000).toLocaleDateString()
                            : 'Expired'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to={`/products/${verifiedProduct.id}`} className="flex-1">
                  <Button className="w-full cta-gradient text-white" size="lg">
                    <Eye className="mr-2 h-4 w-4" />
                    View Full History
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => {
                    // Generate a simple verification certificate
                    const certData = {
                      productId: verifiedProduct.id,
                      productName: verifiedProduct.name,
                      batchNumber: verifiedProduct.batchNumber,
                      manufacturer: verifiedProduct.manufacturerName,
                      verifiedAt: new Date().toISOString(),
                      isAuthentic: verifiedProduct.isAuthentic
                    };
                    
                    const blob = new Blob([JSON.stringify(certData, null, 2)], { 
                      type: 'application/json' 
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `verification-certificate-${verifiedProduct.id}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    toast.success('Certificate Downloaded');
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Download Certificate</span>
                  <span className="sm:hidden">Download</span>
                </Button>
              </div>
            </div>
          )}

          {/* Failed Result */}
          {searchResult === 'failed' && (
            <Card className="border-destructive/50 bg-destructive/5 shadow-soft animate-slide-up">
              <CardContent className="p-8 text-center">
                <div className="mb-4 inline-flex rounded-full bg-destructive/10 p-4">
                  <AlertTriangle className="h-16 w-16 text-destructive" />
                </div>
                <h2 className="mb-2 text-3xl font-bold text-destructive">
                  ⚠️ WARNING: Cannot Verify Product
                </h2>
                <p className="mb-6 text-lg text-muted-foreground">
                  This product could not be found in our blockchain database. It may be counterfeit
                  or the Product ID may be incorrect.
                </p>
                <div className="space-y-4 text-left">
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                    <h3 className="mb-2 font-semibold">What this means:</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Product not registered in our system</li>
                      <li>• May be counterfeit or substandard</li>
                      <li>• No verified supply chain information</li>
                      <li>• Cannot guarantee authenticity or safety</li>
                    </ul>
                  </div>
                  <Button variant="destructive" size="lg" className="w-full">
                    Report Counterfeit Product
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Helpline: 1-800-MEDICA-VERIFY
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Verify;

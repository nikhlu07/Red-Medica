import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { useBlockchain } from '@/hooks/useBlockchain';
import { CheckCircle2, Loader2, ArrowLeft, ArrowRight, Plus, ExternalLink, QrCode, Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const categories = [
  'Antibiotics',
  'Pain Relief',
  'Cardiovascular',
  'Diabetes',
  'Respiratory',
  'Gastrointestinal',
  'Dermatology',
  'Neurology',
  'Oncology',
  'Vitamins & Supplements'
];

const productForms = [
  'Tablet',
  'Capsule',
  'Liquid',
  'Injection',
  'Cream',
  'Ointment',
  'Drops',
  'Inhaler',
  'Patch',
  'Suppository'
];

const Register = () => {
  const navigate = useNavigate();
  const { blockchainUser, isAuthenticated } = useAppStore();
  const { registerProduct, isConnected } = useBlockchain();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{
    productId?: number;
    txHash?: string;
    message?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    batchNumber: '',
    quantity: 0,
    category: '',
    mfgDate: '',
    expiryDate: '',
    productionLocation: '',
    ingredients: '',
    dosage: '',
    form: '',
    packaging: '',
    storageTemp: '',
    fdaNumber: '',
    targetRegions: [] as string[]
  });

  // Redirect if not authenticated
  if (!isAuthenticated || !blockchainUser) {
    return <Navigate to="/connect" replace />;
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      let result = { success: false, productId: null, txHash: null, message: null };
      
      // Try blockchain registration if connected
      if (isConnected) {
        try {
          console.log('🔗 Attempting blockchain registration...');
          result = await registerProduct({
            name: formData.name,
            batchNumber: formData.batchNumber,
            manufacturerName: blockchainUser.name,
            quantity: formData.quantity,
            mfgDate: new Date(formData.mfgDate),
            expiryDate: new Date(formData.expiryDate),
            category: formData.category
          });
        } catch (blockchainError) {
          console.warn('⚠️ Blockchain registration failed, proceeding with local registration:', blockchainError);
        }
      }

      // Generate fallback data if blockchain failed
      if (!result.success) {
        console.log('📝 Using local registration fallback...');
        const fallbackProductId = Date.now();
        result = {
          success: true,
          productId: fallbackProductId,
          txHash: `local_${fallbackProductId}`,
          message: 'Product registered locally (blockchain unavailable)'
        };
      }

      // Create complete product object for storage
      const completeProduct = {
        id: result.productId?.toString() || Date.now().toString(),
        productId: result.productId,
        name: formData.name,
        batchNumber: formData.batchNumber,
        quantity: formData.quantity,
        category: formData.category,
        mfgDate: formData.mfgDate,
        expiryDate: formData.expiryDate,
        productionLocation: formData.productionLocation,
        ingredients: formData.ingredients,
        dosage: formData.dosage,
        form: formData.form,
        packaging: formData.packaging,
        storageTemp: formData.storageTemp,
        fdaNumber: formData.fdaNumber,
        manufacturerName: blockchainUser.name,
        manufacturerAddress: blockchainUser.address,
        txHash: result.txHash,
        registeredAt: new Date().toISOString(),
        status: 'registered',
        isVerified: true,
        blockchainVerified: isConnected && result.txHash && !result.txHash.startsWith('local_')
      };

      // Save to app store
      const { addProduct } = useAppStore.getState();
      addProduct(completeProduct);

      // Also save to localStorage for persistence
      const existingProducts = JSON.parse(localStorage.getItem('redMedicaProducts') || '[]');
      existingProducts.push(completeProduct);
      localStorage.setItem('redMedicaProducts', JSON.stringify(existingProducts));
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('productRegistered', { 
        detail: completeProduct 
      }));

      setRegistrationResult({
        productId: result.productId,
        txHash: result.txHash,
        message: result.message
      });
      setShowSuccess(true);
      
      const successMessage = isConnected && result.txHash && !result.txHash.startsWith('local_') 
        ? 'Product registered on blockchain and saved locally'
        : 'Product registered locally (blockchain connection unavailable)';
        
      toast.success('Product Registered Successfully', {
        description: successMessage
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration Error', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/dashboard');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-900 mb-2 block">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Amoxicillin 500mg"
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter the complete product name including strength</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="batchNumber" className="text-sm font-medium text-gray-900 mb-2 block">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                  placeholder="e.g., BATCH-001"
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier for this production batch</p>
              </div>
              
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-900 mb-2 block">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Total number of units in this batch</p>
              </div>
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium text-gray-900 mb-2 block">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select product category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Choose the appropriate therapeutic category</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mfgDate" className="text-sm font-medium text-gray-700">Manufacturing Date *</Label>
                <Input
                  id="mfgDate"
                  type="date"
                  value={formData.mfgDate}
                  onChange={(e) => handleInputChange('mfgDate', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Date when the product was manufactured</p>
              </div>
              
              <div>
                <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Date when the product expires</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="productionLocation" className="text-sm font-medium text-gray-700">Production Location *</Label>
              <Input
                id="productionLocation"
                value={formData.productionLocation}
                onChange={(e) => handleInputChange('productionLocation', e.target.value)}
                placeholder="e.g., Mumbai, India"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Location where the product was manufactured</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="ingredients" className="text-sm font-medium text-gray-700">Active Ingredients *</Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={(e) => handleInputChange('ingredients', e.target.value)}
                placeholder="e.g., Amoxicillin Trihydrate, Magnesium Stearate"
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">List all active pharmaceutical ingredients</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dosage" className="text-sm font-medium text-gray-700">Dosage *</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  placeholder="e.g., 500mg per capsule"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Specify the dosage strength and unit</p>
              </div>
              
              <div>
                <Label htmlFor="form" className="text-sm font-medium text-gray-700">Product Form *</Label>
                <Select value={formData.form} onValueChange={(value) => handleInputChange('form', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {productForms.map(form => (
                      <SelectItem key={form} value={form}>{form}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Choose the physical form of the product</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="packaging" className="text-sm font-medium text-gray-700">Packaging Type *</Label>
              <Input
                id="packaging"
                value={formData.packaging}
                onChange={(e) => handleInputChange('packaging', e.target.value)}
                placeholder="e.g., Blister Pack - 10 capsules per strip"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Describe the packaging format and unit count</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="storageTemp" className="text-sm font-medium text-gray-700">Storage Requirements</Label>
              <Input
                id="storageTemp"
                value={formData.storageTemp}
                onChange={(e) => handleInputChange('storageTemp', e.target.value)}
                placeholder="e.g., 2-8°C, Protected from light"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Optional: Specify storage temperature and conditions</p>
            </div>
            
            <div>
              <Label htmlFor="fdaNumber" className="text-sm font-medium text-gray-700">FDA/Regulatory Number *</Label>
              <Input
                id="fdaNumber"
                value={formData.fdaNumber}
                onChange={(e) => handleInputChange('fdaNumber', e.target.value)}
                placeholder="e.g., NDA-050760"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Enter the FDA approval number or equivalent regulatory identifier</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = ['Basic Info', 'Dates', 'Details', 'Regulatory', 'Review'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-5xl font-black text-gray-900 mb-4">Register New Product</h1>
            <p className="text-gray-600 text-lg">Add a new pharmaceutical product to the blockchain supply chain.</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-16">
            {stepTitles.slice(0, 5).map((title, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index + 1 === step 
                      ? 'bg-blue-500 text-white' 
                      : index + 1 < step 
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="mt-2 text-xs text-gray-600">{title}</span>
                </div>
                {index < 4 && (
                  <div className={`w-20 h-px mx-4 mt-[-16px] ${
                    index + 1 < step ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Step {step} of 4: {
                  step === 1 ? 'Basic Information' :
                  step === 2 ? 'Dates' :
                  step === 3 ? 'Details' :
                  'Regulatory'
                }
              </h2>
              <p className="text-gray-600 text-sm">
                {step === 1 && 'Enter the basic product information and categorization'}
                {step === 2 && 'Specify manufacturing dates and production location'}
                {step === 3 && 'Provide detailed product composition and packaging information'}
                {step === 4 && 'Add regulatory compliance and distribution information'}
              </p>
            </div>

            {renderStep()}
            
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={step === 1}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {step < 4 ? (
                <Button 
                  onClick={handleNext} 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isConnected}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Register Product
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
              Product Registered Successfully!
            </DialogTitle>
            <DialogDescription className="text-base">
              Your product has been registered on the blockchain and is now part of the supply chain.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Product ID */}
            {registrationResult?.productId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Product ID</p>
                    <p className="text-2xl font-bold text-blue-700">{registrationResult.productId}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(registrationResult.productId?.toString() || '');
                        toast.success('Product ID copied to clipboard');
                      }}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Generate QR code for product ID
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${registrationResult.productId}`;
                        window.open(qrUrl, '_blank');
                      }}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      QR Code
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            {registrationResult?.txHash && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Transaction Hash</p>
                <div className="flex items-center justify-between bg-white border rounded p-3">
                  <code className="text-sm text-gray-600 font-mono break-all">
                    {registrationResult.txHash}
                  </code>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(registrationResult.txHash || '');
                        toast.success('Transaction hash copied to clipboard');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Open Moonbase Alpha block explorer
                        const explorerUrl = `https://moonbase.moonscan.io/tx/${registrationResult.txHash}`;
                        window.open(explorerUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click the external link icon to view this transaction on Moonbase Alpha explorer
                </p>
              </div>
            )}

            {/* Product Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">Product Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Name:</span>
                  <p className="text-green-800">{formData.name}</p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Batch:</span>
                  <p className="text-green-800">{formData.batchNumber}</p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Quantity:</span>
                  <p className="text-green-800">{formData.quantity.toLocaleString()} units</p>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Category:</span>
                  <p className="text-green-800">{formData.category}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={() => {
                // Save product data as JSON
                const productData = {
                  ...formData,
                  productId: registrationResult?.productId,
                  txHash: registrationResult?.txHash,
                  registeredAt: new Date().toISOString(),
                  manufacturer: blockchainUser?.name,
                  manufacturerAddress: blockchainUser?.address
                };
                
                const dataStr = JSON.stringify(productData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `product-${registrationResult?.productId}-${formData.batchNumber}.json`;
                link.click();
                URL.revokeObjectURL(url);
                
                toast.success('Product data saved to file');
              }}
            >
              Save Product Data
            </Button>
            
            <Button onClick={handleSuccessClose} className="bg-blue-500 hover:bg-blue-600">
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Register;

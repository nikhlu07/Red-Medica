import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { useBlockchain } from '@/hooks/useBlockchain';
import { toast } from 'sonner';

const RegisterSimple = () => {
  const navigate = useNavigate();
  const { blockchainUser, isAuthenticated } = useAppStore();
  const { registerProduct } = useBlockchain();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    batchNumber: '',
    quantity: 1,
    category: 'Antibiotic',
    mfgDate: '',
    expiryDate: '',
  });

  if (!isAuthenticated || blockchainUser?.role !== 'manufacturer') {
    return <Navigate to="/connect" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await registerProduct({
        ...formData,
        manufacturerName: blockchainUser?.name || 'Demo Manufacturer',
      });

      toast.success('Product Registered!', {
        description: `Product ID: ${result.productId}`
      });

      navigate('/dashboard');
    } catch (error) {
      toast.error('Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Register New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="mfgDate">Manufacturing Date</Label>
                  <Input
                    id="mfgDate"
                    type="date"
                    value={formData.mfgDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, mfgDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Registering...' : 'Register Product'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default RegisterSimple;
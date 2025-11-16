import { useState, useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useDevice, useHapticFeedback } from '@/hooks/use-device';
import { usePullToRefresh } from '@/hooks/use-swipe';

import {
  Package,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
  QrCode,
  ArrowRight,
  LayoutDashboard,
  AlertCircle,
  Loader2,
  Search,
  Shield,
  Activity,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  MapPin,
  Zap,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTooltip } from '@/components/HelpTooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Product } from '@/types/blockchain';

const Dashboard = () => {
  const { blockchainUser, isAuthenticated } = useAppStore();
  const { isConnected, networkInfo, verifyProduct, checkManufacturerStatus } = useBlockchain();
  

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [networkHealth, setNetworkHealth] = useState<any>(null);
  const { isMobile, hasTouch } = useDevice();
  const { lightTap, successTap } = useHapticFeedback();

  // Advanced dashboard state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'batch' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Real products from localStorage and store
  const [realProducts, setRealProducts] = useState<any[]>([]);

  if (!isAuthenticated || !blockchainUser) {
    return <Navigate to="/connect" replace />;
  }

  // Function to load real products from localStorage
  const loadRealProducts = () => {
    try {
      const savedProducts = JSON.parse(localStorage.getItem('redMedicaProducts') || '[]');
      console.log('📦 Loading products from localStorage:', savedProducts.length);
      setRealProducts(savedProducts);
      return savedProducts;
    } catch (error) {
      console.error('❌ Failed to load products from localStorage:', error);
      return [];
    }
  };

  // Listen for product registration events (you can call this from the register page)
  useEffect(() => {
    const handleProductRegistered = async (event: any) => {
      const { productId, txHash, productData } = event.detail;
      
      console.log('Product registered event received:', { productId, txHash });
      
      // Increment counter for UI
      incrementUserProducts();
      
      // Try to fetch the actual product from blockchain
      if (productId && isConnected) {
        try {
          const realProduct = await verifyProduct(productId);
          if (realProduct) {
            setProducts(prev => [realProduct, ...prev]);
            toast.success('Product added to dashboard', {
              description: `Product #${productId} is now visible in your dashboard`
            });
          }
        } catch (error) {
          console.error('Failed to fetch registered product:', error);
        }
      }
    };

    // Listen for custom events from other components
    window.addEventListener('productRegistered', handleProductRegistered);
    
    return () => {
      window.removeEventListener('productRegistered', handleProductRegistered);
    };
  }, [isConnected, verifyProduct]);

  // Demo products for display with more variety
  const demoProducts = [
    {
      id: 1001,
      name: 'Amoxicillin 500mg',
      batchNumber: 'AMX-2024-001',
      category: 'Antibiotic',
      mfgDate: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // 30 days ago
      manufacturer: '0x1234...5678',
      currentHolder: '0x1234...5678',
      isAuthentic: true,
      status: 'verified',
      location: 'Warehouse A',
      quantity: 1000,
    },
    {
      id: 1002,
      name: 'Paracetamol 650mg',
      batchNumber: 'PCM-2024-002',
      category: 'Analgesic',
      mfgDate: Math.floor(Date.now() / 1000) - (15 * 24 * 60 * 60), // 15 days ago
      manufacturer: '0x1234...5678',
      currentHolder: '0x1234...5678',
      isAuthentic: true,
      status: 'in-transit',
      location: 'Distribution Center B',
      quantity: 500,
    },
    {
      id: 1003,
      name: 'Insulin Glargine',
      batchNumber: 'INS-2024-003',
      category: 'Diabetes',
      mfgDate: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // 7 days ago
      manufacturer: '0x1234...5678',
      currentHolder: '0x1234...5678',
      isAuthentic: true,
      status: 'delivered',
      location: 'Pharmacy C',
      quantity: 200,
    },
    {
      id: 1004,
      name: 'Aspirin 100mg',
      batchNumber: 'ASP-2024-004',
      category: 'Cardiovascular',
      mfgDate: Math.floor(Date.now() / 1000) - (45 * 24 * 60 * 60), // 45 days ago
      manufacturer: '0x1234...5678',
      currentHolder: '0x1234...5678',
      isAuthentic: true,
      status: 'verified',
      location: 'Warehouse A',
      quantity: 2000,
    },
    {
      id: 1005,
      name: 'Metformin 850mg',
      batchNumber: 'MET-2024-005',
      category: 'Diabetes',
      mfgDate: Math.floor(Date.now() / 1000) - (20 * 24 * 60 * 60), // 20 days ago
      manufacturer: '0x1234...5678',
      currentHolder: '0x1234...5678',
      isAuthentic: true,
      status: 'in-transit',
      location: 'Distribution Center D',
      quantity: 750,
    },
    {
      id: 1006,
      name: 'Ibuprofen 400mg',
      batchNumber: 'IBU-2024-006',
      category: 'Analgesic',
      mfgDate: Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60), // 10 days ago
      manufacturer: '0x1234...5678',
      currentHolder: '0x1234...5678',
      isAuthentic: true,
      status: 'delivered',
      location: 'Pharmacy E',
      quantity: 300,
    }
  ];

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const cats = [...new Set(demoProducts.map(p => p.category))];
    return cats.sort();
  }, []);

  // Get unique statuses for filtering
  const statuses = useMemo(() => {
    const stats = [...new Set(demoProducts.map(p => p.status))];
    return stats.sort();
  }, []);

  // Filter and sort products - combine demo + real products
  const filteredAndSortedProducts = useMemo(() => {
    // Always show demo products + any real products added
    const allProducts = [...demoProducts, ...realProducts];
    let filtered = allProducts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product => product.status === selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = a.mfgDate;
          bValue = b.mfgDate;
          break;
        case 'batch':
          aValue = a.batchNumber.toLowerCase();
          bValue = b.batchNumber.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [realProducts, searchQuery, selectedCategory, selectedStatus, sortBy, sortOrder]);

  // Helper functions for colors
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Antibiotic': '#3B82F6',
      'Analgesic': '#10B981',
      'Diabetes': '#F59E0B',
      'Cardiovascular': '#EF4444',
    };
    return colors[category] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'verified': '#10B981',
      'in-transit': '#F59E0B',
      'delivered': '#3B82F6',
    };
    return colors[status] || '#6B7280';
  };

  // Analytics data - combine demo + real products
  const analyticsData = useMemo(() => {
    const products = [...demoProducts, ...realProducts];
    
    // Category distribution
    const categoryData = categories.map(category => ({
      name: category,
      value: products.filter(p => p.category === category).length,
      color: getCategoryColor(category),
    }));

    // Status distribution
    const statusData = statuses.map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: products.filter(p => p.status === status).length,
      color: getStatusColor(status),
    }));

    // Monthly production trend (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en', { month: 'short' });
      
      // Simulate production data
      const productsInMonth = Math.floor(Math.random() * 50) + 20;
      monthlyData.push({
        month: monthName,
        products: productsInMonth,
        verified: Math.floor(productsInMonth * 0.95),
        inTransit: Math.floor(productsInMonth * 0.3),
      });
    }

    return {
      categoryData,
      statusData,
      monthlyData,
      totalProducts: products.length,
      totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
    };
  }, [realProducts, categories, statuses]);

  // Export functionality
  const exportData = (format: 'csv' | 'json') => {
    const data = filteredAndSortedProducts.map(product => ({
      ID: product.id,
      Name: product.name,
      'Batch Number': product.batchNumber,
      Category: product.category,
      Status: product.status,
      'Manufacturing Date': new Date(product.mfgDate * 1000).toLocaleDateString(),
      Location: product.location,
      Quantity: product.quantity,
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `red-medica-products-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `red-medica-products-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`Data exported as ${format.toUpperCase()}`);
  };

  // Load user's products and network health on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const realProducts: Product[] = [];
        
        // Try to fetch some recent products (you might need to implement a method to get user's products)
        // For now, we'll show demo products and real registered ones will appear via events
        if (isConnected && blockchainUser) {
          // Check if user is authorized manufacturer
          const isAuthorized = await checkManufacturerStatus(blockchainUser.address);
          console.log('User authorization status:', isAuthorized);
        }
        
        // Start with demo products, real ones will be added via events
        setProducts([...demoProducts, ...realProducts]);
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
    
    // Load real products from localStorage
    loadRealProducts();
    
    // Listen for new product registrations
    const handleProductRegistered = () => {
      console.log('🔄 Product registered, refreshing dashboard...');
      loadRealProducts();
    };
    
    const handleStorageChange = () => {
      loadRealProducts();
    };
    
    window.addEventListener('productRegistered', handleProductRegistered);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('productRegistered', handleProductRegistered);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isConnected, blockchainUser, checkManufacturerStatus]);

  // Pull to refresh functionality for mobile
  const handleRefresh = async () => {
    successTap(); // Haptic feedback
    const loadDashboardData = async () => {
      try {
        setProducts([]);
        if (isConnected) {
          // const health = await healthCheck();
          // setNetworkHealth(health);
        }
        toast.success('Dashboard refreshed');
      } catch (error) {
        console.error('Failed to refresh dashboard:', error);
        toast.error('Failed to refresh dashboard');
      }
    };
    await loadDashboardData();
  };

  const pullToRefreshRef = usePullToRefresh(handleRefresh, {
    enabled: isMobile && hasTouch,
    threshold: 80,
  });

  const stats = {
    totalProducts: demoProducts.length + realProducts.length, // Demo + real products
    activeShipments: filteredAndSortedProducts.filter(p => p.status === 'in-transit').length,
    delivered: filteredAndSortedProducts.filter(p => p.status === 'delivered').length,
    verified: filteredAndSortedProducts.filter(p => p.status === 'verified').length,
  };

  return (
    <>
      <style>{`
        body {
            font-family: 'Inter', sans-serif;
            background: #F7FAFC;
            color: #ffffff;
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
        .table-row-hover:hover {
          background-color: #F7FAFC;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />

        <main 
          className="container mx-auto max-w-7xl mobile-padding pt-28 pb-8 mobile-scroll" 
          ref={pullToRefreshRef}
        >
          {/* Pull to refresh hint for mobile */}
          {isMobile && hasTouch && (
            <div className="text-center py-2 text-xs text-gray-400">
              Pull down to refresh
            </div>
          )}

          {/* Network Status Alert */}
          {!isConnected && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Network Disconnected:</strong> You are not connected to the blockchain network. 
                Some features may be limited.
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="mb-8 md:mb-12 text-center px-2">
            <div className="mb-4 md:mb-6 inline-flex rounded-full bg-blue-100 p-3 md:p-4">
                <LayoutDashboard className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-black tracking-tighter text-gray-900">
              Dashboard
            </h1>
            <p className="mx-auto max-w-2xl text-base md:text-lg text-gray-600 px-4">
             Welcome back, {blockchainUser.name}. You are logged in as a {blockchainUser.role}.
            </p>
            
            {/* Connection Status */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Blockchain Connected' : 'Blockchain Disconnected'}
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

          {/* Stats Grid */}
          <div className="mb-6 md:mb-8 grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-lift card-glow animate-slide-in-left" style={{ animationDelay: '100ms' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  Total Products
                  <HelpTooltip
                    content="Total number of products you have registered on the blockchain. This includes all products across all batches."
                    type="info"
                  />
                </CardTitle>
                <Package className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 animate-bounce-gentle">{stats.totalProducts}</div>
                <p className="text-xs text-gray-500">+2% from last month</p>
              </CardContent>
            </Card>

            <Card className="hover-lift card-glow animate-slide-in-left" style={{ animationDelay: '200ms' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  Active Shipments
                  <HelpTooltip
                    content="Products currently in transit between supply chain partners. These products are awaiting custody transfer confirmation."
                    type="info"
                  />
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.activeShipments}</div>
                <p className="text-xs text-gray-500">In transit now</p>
              </CardContent>
            </Card>

            <Card className="hover-lift card-glow animate-slide-in-right" style={{ animationDelay: '300ms' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  Delivered
                  <HelpTooltip
                    content="Products that have been successfully delivered to their final destination in the supply chain."
                    type="info"
                  />
                </CardTitle>
                <CheckCircle2 className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.delivered}</div>
                <p className="text-xs text-gray-500">Successfully delivered</p>
              </CardContent>
            </Card>

            <Card className="hover-lift card-glow animate-slide-in-right" style={{ animationDelay: '400ms' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  Verified
                  <HelpTooltip
                    content="Products that have been verified as authentic through QR code scanning or blockchain verification."
                    type="info"
                  />
                </CardTitle>
                <Shield className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.verified}</div>
                <p className="text-xs text-gray-500">Verified products</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8 hover-lift animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="text-xl font-bold animate-slide-up flex items-center gap-2">
                Quick Actions
                <HelpTooltip
                  content="Common tasks based on your role in the supply chain. These actions help you manage your products efficiently."
                  type="info"
                />
              </CardTitle>
              <CardDescription className="text-gray-600 animate-slide-up" style={{ animationDelay: '100ms' }}>
                Common tasks for {blockchainUser.role}s
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockchainUser.role === 'manufacturer' ? (
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <Link to="/register">
                    <Button 
                      className="w-full cta-gradient font-semibold touch-target touch-friendly btn-primary hover-glow animate-scale-in group" 
                      size="lg"
                      disabled={!isConnected}
                      onClick={() => lightTap()}
                      style={{ animationDelay: '600ms' }}
                    >
                      <Plus className="mr-2 h-4 md:h-5 w-4 md:w-5 transition-transform duration-300 group-hover:rotate-90" />
                      <span className="text-sm md:text-base">Register New Product</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full font-medium text-gray-700 hover:text-blue-500 hover:bg-gray-100 hover:border-blue-500 touch-target touch-friendly hover-lift animate-scale-in group"
                    disabled={!isConnected}
                    onClick={() => {
                      lightTap();
                      toast.info('QR Code generation will be available after product registration');
                    }}
                    style={{ animationDelay: '700ms' }}
                  >
                    <QrCode className="mr-2 h-4 md:h-5 w-4 md:w-5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-sm md:text-base">Generate QR Codes</span>
                  </Button>
                  <Link to="/analytics">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full font-medium text-gray-700 hover:text-blue-500 hover:bg-gray-100 hover:border-blue-500 hover-lift animate-scale-in group"
                      style={{ animationDelay: '800ms' }}
                    >
                      <Eye className="mr-2 h-4 md:h-5 w-4 md:w-5 transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-sm md:text-base">View All Products</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <Link to="/verify" className="sm:col-span-2 lg:col-span-1">
                    <Button className="w-full cta-gradient font-semibold" size="lg">
                      <Search className="mr-2 h-4 md:h-5 w-4 md:w-5" />
                      <span className="text-sm md:text-base">Verify Product</span>
                    </Button>
                  </Link>
                  <Link to="/verify">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full font-medium text-gray-700 hover:text-blue-500 hover:bg-gray-100 hover:border-blue-500"
                    >
                      <QrCode className="mr-2 h-4 md:h-5 w-4 md:w-5" />
                      <span className="text-sm md:text-base">Scan QR Code</span>
                    </Button>
                  </Link>
                  <Link to="/help">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full font-medium text-gray-700 hover:text-blue-500 hover:bg-gray-100 hover:border-blue-500"
                    >
                      <Shield className="mr-2 h-4 md:h-5 w-4 md:w-5" />
                      <span className="text-sm md:text-base">Learn More</span>
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>   
       {/* Analytics Section */}
          {showAnalytics && (
            <Card className="mb-8 hover-lift animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                      Analytics Dashboard
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Insights and trends for your pharmaceutical products
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnalytics(false)}
                  >
                    Hide Analytics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Monthly Production Trend */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4 text-blue-600" />
                      Production Trend (Last 6 Months)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="products"
                          stackId="1"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.6}
                          name="Total Products"
                        />
                        <Area
                          type="monotone"
                          dataKey="verified"
                          stackId="2"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.6}
                          name="Verified"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Distribution */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <PieChart className="mr-2 h-4 w-4 text-green-600" />
                      Category Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {analyticsData.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Status Distribution */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Activity className="mr-2 h-4 w-4 text-orange-600" />
                      Status Overview
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analyticsData.statusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Key Metrics */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Zap className="mr-2 h-4 w-4 text-purple-600" />
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analyticsData.totalProducts}</div>
                        <div className="text-sm text-gray-600">Total Products</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analyticsData.totalQuantity.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Units</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{categories.length}</div>
                        <div className="text-sm text-gray-600">Categories</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round((stats.verified / stats.totalProducts) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Verification Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}  
        {/* Search, Filter, and Controls */}
          <Card className="mb-6 hover-lift animate-fade-in">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold">Product Management</CardTitle>
                  <CardDescription className="text-gray-600">
                    Search, filter, and manage your pharmaceutical products
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {showAnalytics ? 'Hide' : 'Show'} Analytics
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => exportData('csv')}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportData('json')}>
                        Export as JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products, batches, or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort Controls */}
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="batch">Batch</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Showing {filteredAndSortedProducts.length} of {stats.totalProducts} products
                  {searchQuery && (
                    <Badge variant="secondary" className="ml-2">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="ml-2">
                      Category: {selectedCategory}
                    </Badge>
                  )}
                  {selectedStatus !== 'all' && (
                    <Badge variant="secondary" className="ml-2">
                      Status: {selectedStatus}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                    setSortBy('date');
                    setSortOrder('desc');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>    
      {/* Recent Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Recent Products</CardTitle>
              <CardDescription className="text-gray-600">
                Your latest registered pharmaceutical products
              </CardDescription>
            </CardHeader>
            <CardContent>
              {demoProducts.length + realProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-600 mb-6">Start by registering your first pharmaceutical product</p>
                  {blockchainUser.role === 'manufacturer' ? (
                    <Link to="/register">
                      <Button 
                        className="cta-gradient"
                        onClick={() => lightTap()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Register First Product
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/verify">
                      <Button className="cta-gradient">
                        <Search className="mr-2 h-4 w-4" />
                        Verify First Product
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-gray-200">
                          <TableHead className="font-semibold text-gray-600">Product ID</TableHead>
                          <TableHead className="font-semibold text-gray-600">Name</TableHead>
                          <TableHead className="font-semibold text-gray-600">Batch</TableHead>
                          <TableHead className="font-semibold text-gray-600">Category</TableHead>
                          <TableHead className="font-semibold text-gray-600">Status</TableHead>
                          <TableHead className="font-semibold text-gray-600">Location</TableHead>
                          <TableHead className="font-semibold text-gray-600">Quantity</TableHead>
                          <TableHead className="font-semibold text-gray-600">Date</TableHead>
                          <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedProducts.map((product) => (
                          <TableRow key={product.id} className="border-b-gray-200 table-row-hover">
                            <TableCell className="font-mono text-sm text-gray-800">
                              #{product.id}
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                            <TableCell className="text-gray-700">{product.batchNumber}</TableCell>
                            <TableCell>
                              <Badge variant="outline" style={{ borderColor: getCategoryColor(product.category), color: getCategoryColor(product.category) }}>
                                {product.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={product.status} />
                            </TableCell>
                            <TableCell className="text-gray-700 flex items-center">
                              <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                              {product.location}
                            </TableCell>
                            <TableCell className="text-gray-700">{product.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-gray-700">
                              {new Date(product.mfgDate * 1000).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Link to={`/verify?id=${product.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {(demoProducts.length + realProducts.length) > 5 && (
                    <div className="mt-6 border-t border-gray-200 pt-4 text-center">
                      <Button variant="outline" className="font-medium text-gray-700 hover:bg-gray-100 hover:border-blue-500">
                        View All Products
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Dashboard;

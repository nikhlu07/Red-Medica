/**
 * Demo Mode Service
 * Provides fallback functionality when blockchain network is unavailable
 */

interface DemoUser {
  address: string;
  name: string;
  role: 'manufacturer' | 'distributor' | 'pharmacy' | 'consumer';
  isAuthorized: boolean;
  metadata: {
    source: 'demo';
    type: 'simulated';
    network: 'demo';
  };
}

interface DemoProduct {
  id: number;
  name: string;
  batchNumber: string;
  manufacturer: string;
  manufacturerAddress: string;
  quantity: number;
  mfgDate: string;
  expiryDate: string;
  category: string;
  currentHolder: string;
  isAuthentic: boolean;
  createdAt: string;
}

interface DemoTransfer {
  productId: number;
  from: string;
  to: string;
  timestamp: string;
  location: string;
  verified: boolean;
}

class DemoModeService {
  private isEnabled: boolean = false;
  private demoData: any = null;
  private currentUser: DemoUser | null = null;

  constructor() {
    this.isEnabled = import.meta.env.VITE_DEMO_MODE === 'true' || 
                     import.meta.env.VITE_ENABLE_DEMO_FALLBACK === 'true';
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Load demo data
      const response = await fetch('/demo-data/demo-data.json');
      if (response.ok) {
        this.demoData = await response.json();
        console.log('✅ Demo data loaded successfully');
      } else {
        // Fallback to inline demo data
        this.demoData = this.getInlineDemoData();
        console.log('✅ Using inline demo data');
      }
    } catch (error) {
      console.warn('Failed to load demo data, using inline fallback:', error);
      this.demoData = this.getInlineDemoData();
    }
  }

  isInDemoMode(): boolean {
    return this.isEnabled;
  }

  async connectDemoWallet(role: string): Promise<string[]> {
    if (!this.isEnabled) {
      throw new Error('Demo mode not enabled');
    }

    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get demo address for role
    const demoAddresses = {
      'Manufacturer': import.meta.env.VITE_DEMO_MANUFACTURER_1 || '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e1e1',
      'Distributor': import.meta.env.VITE_DEMO_MANUFACTURER_2 || '0x8ba1f109551bD432803012645Hac136c22C85B05',
      'Pharmacy': import.meta.env.VITE_DEMO_MANUFACTURER_3 || '0x95aD61B0a150d79219dCF64E1E6Cc01f0B64C4cE',
      'Patient': '0x1234567890123456789012345678901234567890'
    };

    const address = demoAddresses[role as keyof typeof demoAddresses] || demoAddresses.Patient;

    this.currentUser = {
      address,
      name: `Demo ${role}`,
      role: role.toLowerCase() as any,
      isAuthorized: true,
      metadata: {
        source: 'demo',
        type: 'simulated',
        network: 'demo'
      }
    };

    console.log('✅ Demo wallet connected:', this.currentUser);
    return [address];
  }

  getCurrentUser(): DemoUser | null {
    return this.currentUser;
  }

  async registerProduct(productData: any): Promise<{ success: boolean; productId?: number; error?: string }> {
    if (!this.isEnabled || !this.currentUser) {
      throw new Error('Demo mode not available');
    }

    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const productId = Math.floor(Math.random() * 10000) + 1000;
    
    console.log('✅ Demo product registered:', {
      productId,
      ...productData,
      manufacturer: this.currentUser.address
    });

    return {
      success: true,
      productId
    };
  }

  async verifyProduct(productId: number): Promise<DemoProduct | null> {
    if (!this.isEnabled) return null;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if it's a demo product
    if (this.demoData?.manufacturers) {
      for (const manufacturer of this.demoData.manufacturers) {
        for (const product of manufacturer.products) {
          if (product.id === productId) {
            return {
              id: product.id,
              name: product.name,
              batchNumber: product.batchNumber,
              manufacturer: manufacturer.name,
              manufacturerAddress: manufacturer.address,
              quantity: product.quantity,
              mfgDate: product.mfgDate,
              expiryDate: product.expiryDate,
              category: product.category,
              currentHolder: manufacturer.address,
              isAuthentic: true,
              createdAt: new Date().toISOString()
            };
          }
        }
      }
    }

    // Return null for non-existent products (simulates counterfeit detection)
    return null;
  }

  async getTransferHistory(productId: number): Promise<DemoTransfer[]> {
    if (!this.isEnabled) return [];

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return demo transfer history
    return [
      {
        productId,
        from: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e1e1',
        to: '0x8ba1f109551bD432803012645Hac136c22C85B05',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        location: 'Mumbai → Delhi',
        verified: true
      },
      {
        productId,
        from: '0x8ba1f109551bD432803012645Hac136c22C85B05',
        to: '0x95aD61B0a150d79219dCF64E1E6Cc01f0B64C4cE',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        location: 'Delhi → Local Pharmacy',
        verified: true
      }
    ];
  }

  async transferCustody(productId: number, toAddress: string, location: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isEnabled || !this.currentUser) {
      throw new Error('Demo mode not available');
    }

    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('✅ Demo custody transfer:', {
      productId,
      from: this.currentUser.address,
      to: toAddress,
      location
    });

    return { success: true };
  }

  getDemoData() {
    return this.demoData;
  }

  private getInlineDemoData() {
    return {
      manufacturers: [
        {
          id: 'pharma-corp-001',
          name: 'PharmaCorp International',
          address: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e1e1',
          products: [
            {
              id: 1,
              name: 'Amoxicillin 500mg',
              batchNumber: 'AMX-2024-001',
              quantity: 10000,
              category: 'Antibiotic',
              mfgDate: '2024-09-15',
              expiryDate: '2026-09-15'
            },
            {
              id: 2,
              name: 'Paracetamol 650mg',
              batchNumber: 'PCM-2024-002',
              quantity: 25000,
              category: 'Analgesic',
              mfgDate: '2024-10-01',
              expiryDate: '2027-10-01'
            }
          ]
        },
        {
          id: 'meditech-solutions-002',
          name: 'MediTech Solutions',
          address: '0x8ba1f109551bD432803012645Hac136c22C85B05',
          products: [
            {
              id: 3,
              name: 'Insulin Glargine 100U/ml',
              batchNumber: 'INS-2024-003',
              quantity: 5000,
              category: 'Diabetes',
              mfgDate: '2024-08-20',
              expiryDate: '2026-08-20'
            }
          ]
        }
      ]
    };
  }

  showDemoNotification() {
    if (!this.isEnabled) return;

    // Show a subtle notification that demo mode is active
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #EBF8FF;
        border: 1px solid #BEE3F8;
        border-radius: 8px;
        padding: 12px 16px;
        color: #2A69AC;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 300px;
      ">
        <strong>Demo Mode Active</strong><br>
        Network unavailable, using simulated data
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

export const demoModeService = new DemoModeService();
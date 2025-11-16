import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { moonbeamBlockchainService } from '@/services/moonbeam-blockchain';
import { demoModeService } from '@/services/demo-mode';
import {
  Building2,
  Truck,
  Store,
  User,
  Wifi,
  WifiOff,
  Wallet,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { HelpTooltip } from '@/components/HelpTooltip';
import { NetworkStatus } from '@/types/blockchain';

const Connect = () => {
  const navigate = useNavigate();
  const { connectWallet } = useAppStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: 'Manufacturer',
      title: 'Manufacturer',
      description: 'Register products and initiate supply chain tracking',
      icon: Building2
    },
    {
      id: 'Distributor',
      title: 'Distributor',
      description: 'Receive shipments and manage product transfers',
      icon: Truck
    },
    {
      id: 'Pharmacy',
      title: 'Pharmacy',
      description: 'Stock verified products and serve patients',
      icon: Store
    },
    {
      id: 'Patient',
      title: 'Patient',
      description: 'Verify product authenticity and view supply chain',
      icon: User
    }
  ];

  const handleRoleSelect = async (roleId: string) => {
    setSelectedRole(roleId);
    setIsConnecting(true);

    try {
      console.log('🔄 Starting wallet connection process for role:', roleId);

      // First, try to initialize demo mode service
      await demoModeService.initialize();

      // Always try blockchain first if MetaMask is available, regardless of demo mode settings
      const hasMetaMask = window.ethereum;

      if (hasMetaMask) {
        console.log('✅ MetaMask detected, attempting connection...');

        try {
          // Initialize the moonbeam service first
          await moonbeamBlockchainService.initialize();

          // Use original moonbeam service
          const accounts = await moonbeamBlockchainService.connectWallet();

          if (accounts.length === 0) {
            throw new Error('No accounts selected in MetaMask');
          }

          const connectedAccount = accounts[0];
          console.log('✅ MetaMask connected:', connectedAccount);

          // Update the store with connection info
          const { setUser, setIsAuthenticated, setNetworkInfo } = useAppStore.getState();

          setUser({
            address: connectedAccount,
            name: `${roleId} (${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)})`,
            role: roleId.toLowerCase() as 'manufacturer' | 'distributor' | 'pharmacy' | 'consumer',
            isAuthorized: true,
            metadata: {
              source: 'metamask',
              type: 'ethereum',
              contractAddress: '0xAD6655fa10DB0DDDc079774198E76c457E2e0C8C',
              network: 'Moonbase Alpha'
            }
          });

          setIsAuthenticated(true);
          setNetworkInfo({
            status: NetworkStatus.CONNECTED,
            endpoint: 'https://rpc.api.moonbase.moonbeam.network',
            lastUpdate: Date.now(),
            chainName: 'Moonbase Alpha',
            contractAddress: '0xAD6655fa10DB0DDDc079774198E76c457E2e0C8C',
          });

          connectWallet(roleId as any);

          toast.success('Wallet Connected!', {
            description: `Connected as ${roleId} to Moonbase Alpha`,
            icon: <Wifi className="h-4 w-4" />
          });

          navigate('/dashboard');
          return;

        } catch (blockchainError: any) {
          console.warn('❌ Blockchain connection failed, falling back to demo mode:', blockchainError);

          // Don't show error toast for network issues, just fall through to demo mode
          if (!blockchainError.message?.includes('rejected') && !blockchainError.code === 4001) {
            console.log('🎭 Falling back to demo mode due to network issues');
          } else {
            // User rejected, show error and exit
            toast.error('Connection Rejected', {
              description: 'Connection rejected by user. Please try again and approve the connection.'
            });
            setIsConnecting(false); // Reset connecting state on rejection
            setSelectedRole(null);
            return;
          }
        }
      }

      // Use demo mode (either by choice or as fallback)
      console.log('🎭 Using demo mode for role:', roleId);

      const demoAccounts = await demoModeService.connectDemoWallet(roleId);
      const demoUser = demoModeService.getCurrentUser();

      if (!demoUser) {
        throw new Error('Failed to create demo user');
      }

      // Update store with demo connection
      const { setUser, setIsAuthenticated, setNetworkInfo } = useAppStore.getState();

      setUser({
        address: demoUser.address,
        name: demoUser.name,
        role: demoUser.role,
        isAuthorized: demoUser.isAuthorized,
        metadata: demoUser.metadata
      });

      setIsAuthenticated(true);
      setNetworkInfo({
        status: NetworkStatus.CONNECTED,
        endpoint: 'demo-mode',
        lastUpdate: Date.now(),
        chainName: 'Demo Network',
        contractAddress: 'demo-contract',
      });

      connectWallet(roleId as any);

      // Show demo mode notification
      demoModeService.showDemoNotification();

      toast.success('Demo Mode Connected!', {
        description: `Connected as ${roleId} in demonstration mode`,
        icon: <WifiOff className="h-4 w-4" />
      });

      navigate('/dashboard');

    } catch (error: any) {
      console.error('❌ Connection error:', error);

      toast.error('Connection Failed', {
        description: 'Unable to connect in either blockchain or demo mode. Please try again.',
        duration: 6000
      });
    } finally {
      setIsConnecting(false);
      setSelectedRole(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <Navbar />

        <main className="container mx-auto max-w-7xl px-4 pt-28 pb-8">
          {/* Header Section */}
          <div className="mb-8 md:mb-12 text-center px-2">
            <div className="mb-4 md:mb-6 inline-flex rounded-full bg-blue-100 p-3 md:p-4">
              <Wallet className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-black tracking-tighter text-gray-900">
              Connect Your Wallet
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-base md:text-lg text-gray-600 px-4">
              Select your role within the Red Médica ecosystem to get started. Each role has
              a unique dashboard and set of permissions.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => {
              const IconComponent = role.icon;
              const isSelected = selectedRole === role.id;
              const isLoading = isConnecting && isSelected;

              return (
                <Card
                  key={role.id}
                  className={`flex flex-col text-center cursor-pointer group transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50 ${isConnecting && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isConnecting && handleRoleSelect(role.id)}
                >
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="mb-4 inline-flex self-center rounded-lg bg-blue-100 p-4 text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                      {role.title}
                      <HelpTooltip
                        content={`As a ${role.title.toLowerCase()}, you can ${role.description.toLowerCase()}.`}
                        type="info"
                      />
                    </h3>
                    <p className="mb-6 flex-grow text-sm text-gray-600">
                      {role.description}
                    </p>
                    <Button
                      className="w-full font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 transition-opacity"
                      disabled={isConnecting}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isConnecting) {
                          handleRoleSelect(role.id);
                        }
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect as ' + role.title
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Connect;

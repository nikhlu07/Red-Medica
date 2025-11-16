import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { 
  Wallet, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ExternalLink, 
  Users, 
  RefreshCw,
  LogOut,
  Copy,
  Check,
  Building2,
  Truck,
  Store,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface WalletConnectionProps {
  onConnected?: (account: InjectedAccountWithMeta) => void;
  onDisconnected?: () => void;
  showDisconnect?: boolean;
  compact?: boolean;
}

export const WalletConnection = ({ 
  onConnected, 
  onDisconnected, 
  showDisconnect = true,
  compact = false 
}: WalletConnectionProps) => {
  const {
    isConnected,
    isConnecting,
    accounts,
    selectedAccount,
    error,
    isInitialized,
    connectWallet,
    selectAccount,
    disconnectWallet,
    isExtensionInstalled,
    getAvailableExtensions,
  } = useWallet();

  const [step, setStep] = useState<'extension' | 'connect' | 'select' | 'role'>('extension');
  const [isSelectingAccount, setIsSelectingAccount] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedAccountForRole, setSelectedAccountForRole] = useState<InjectedAccountWithMeta | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Initialize step based on MetaMask availability
  useState(() => {
    if ((window as any).ethereum) {
      setStep(isConnected ? 'select' : 'connect');
    }
  });

  const handleConnectWallet = async () => {
    try {
      const accounts = await connectWallet();
      if (accounts.length > 0) {
        setStep('select');
      }
    } catch (error) {
      toast.error('Connection Failed', {
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
      });
    }
  };

  const handleSelectAccount = async (account: InjectedAccountWithMeta) => {
    // Move to role selection step instead of immediately selecting account
    setSelectedAccountForRole(account);
    setStep('role');
  };

  const handleRoleSelection = async () => {
    if (!selectedAccountForRole || !selectedRole) {
      toast.error('Please select a role');
      return;
    }

    try {
      setIsSelectingAccount(true);
      await selectAccount(selectedAccountForRole);
      
      // Override the role detection with user selection
      const { setUser } = useAppStore.getState();
      setUser({
        address: selectedAccountForRole.address,
        name: selectedAccountForRole.meta.name || `Account ${selectedAccountForRole.address.slice(0, 8)}...`,
        role: selectedRole as 'manufacturer' | 'consumer',
      });

      onConnected?.(selectedAccountForRole);
      toast.success('Account Connected', {
        description: `Connected as ${selectedRole} with account ${selectedAccountForRole.meta.name || selectedAccountForRole.address.slice(0, 8)}...`,
      });
    } catch (error) {
      toast.error('Account Selection Failed', {
        description: error instanceof Error ? error.message : 'Failed to select account',
      });
    } finally {
      setIsSelectingAccount(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setStep('connect');
    setSelectedAccountForRole(null);
    setSelectedRole('');
    onDisconnected?.();
    toast.info('Wallet Disconnected');
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success('Address Copied');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  // If already connected and we have a selected account, show connected state
  if (isConnected && selectedAccount && !compact) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mb-4 inline-flex rounded-full bg-green-100 p-4 mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Wallet Connected</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg bg-gray-50">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {(selectedAccount.meta.name || selectedAccount.address).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className="font-medium">{selectedAccount.meta.name || 'Unnamed Account'}</p>
                {selectedAccount.meta.source && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedAccount.meta.source}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">
                  {selectedAccount.address.slice(0, 12)}...{selectedAccount.address.slice(-12)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyAddress(selectedAccount.address)}
                  className="h-6 w-6 p-0"
                >
                  {copiedAddress === selectedAccount.address ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {showDisconnect && (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect Wallet
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Compact version for navbar or small spaces
  if (compact) {
    if (isConnected && selectedAccount) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {(selectedAccount.meta.name || selectedAccount.address).charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{selectedAccount.meta.name || 'Account'}</p>
            <p className="text-xs text-gray-500">
              {selectedAccount.address.slice(0, 6)}...{selectedAccount.address.slice(-4)}
            </p>
          </div>
          {showDisconnect && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="h-8 w-8 p-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      );
    }

    return (
      <Button
        onClick={handleConnectWallet}
        disabled={isConnecting || !isInitialized}
        size="sm"
      >
        {isConnecting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4 mr-2" />
        )}
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    );
  }

  // MetaMask not installed
  if (step === 'extension') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mb-4 inline-flex rounded-full bg-orange-100 p-4 mx-auto">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle>MetaMask Required</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            To connect to Red Médica on Moonbase Alpha, you need MetaMask browser extension.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-blue-900 mb-2">Why MetaMask?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Native support for Moonbeam/Moonbase Alpha</li>
              <li>• Secure transaction signing</li>
              <li>• Automatic network switching</li>
              <li>• Your keys never leave your browser</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Install MetaMask
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('connect')}
              className="w-full"
            >
              I Already Have MetaMask
            </Button>
          </div>

          <div className="pt-4 border-t space-y-2">
            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
              className="w-full text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <p className="text-xs text-gray-500">
              After installing MetaMask, please refresh this page
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connect wallet step
  if (step === 'connect') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4 mx-auto">
            <Wallet className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Connect Your Wallet</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Connect your MetaMask wallet to access the Red Médica platform on Moonbase Alpha.
          </p>
          
          {/* Network Status */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-gray-600">
              {isInitialized ? 'Blockchain Connected' : 'Connecting to Blockchain...'}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Connection Error</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleConnectWallet}
            disabled={isConnecting || !isInitialized}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>

          {!isInitialized && (
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Initializing blockchain connection...</span>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setStep('extension')}
              className="w-full text-sm"
            >
              Extension Not Working?
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Role selection step
  if (step === 'role' && selectedAccountForRole) {
    const roleOptions = [
      {
        value: 'manufacturer',
        label: 'Manufacturer',
        description: 'Register and manage pharmaceutical products',
        icon: Building2,
        color: 'text-blue-600 bg-blue-100'
      },
      {
        value: 'consumer',
        label: 'Consumer/Verifier',
        description: 'Verify product authenticity and view supply chain',
        icon: User,
        color: 'text-green-600 bg-green-100'
      }
    ];

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mb-4 inline-flex rounded-full bg-purple-100 p-4 mx-auto">
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle>Select Your Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Choose your role to customize your Red Médica experience.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {(selectedAccountForRole.meta.name || selectedAccountForRole.address).charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-500">
                {selectedAccountForRole.meta.name || `${selectedAccountForRole.address.slice(0, 8)}...`}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Select Role</Label>
            <div className="space-y-2">
              {roleOptions.map((role) => {
                const IconComponent = role.icon;
                return (
                  <div
                    key={role.value}
                    className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedRole === role.value 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedRole(role.value)}
                  >
                    <div className={`p-2 rounded-lg ${role.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{role.label}</h3>
                        {selectedRole === role.value && (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleRoleSelection}
              disabled={!selectedRole || isSelectingAccount}
              className="w-full"
            >
              {isSelectingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Connect as {roleOptions.find(r => r.value === selectedRole)?.label}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setStep('select');
                setSelectedAccountForRole(null);
                setSelectedRole('');
              }}
              disabled={isSelectingAccount}
              className="w-full"
            >
              Back to Account Selection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Select account step
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mb-4 inline-flex rounded-full bg-green-100 p-4 mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle>Select Your Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2 mb-6">
          <p className="text-gray-600">
            Choose which account you'd like to use with Red Médica.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.address}
              className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                isSelectingAccount ? 'opacity-50 pointer-events-none' : ''
              }`}
              onClick={() => !isSelectingAccount && handleSelectAccount(account)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {(account.meta.name || account.address).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{account.meta.name || 'Unnamed Account'}</p>
                    {account.meta.source && (
                      <Badge variant="secondary" className="text-xs">
                        {account.meta.source}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500">
                      {account.address.slice(0, 12)}...{account.address.slice(-12)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyAddress(account.address);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      {copiedAddress === account.address ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  {account.type && (
                    <p className="text-xs text-gray-400 capitalize">
                      {account.type} account
                    </p>
                  )}
                </div>
              </div>
              <Button 
                size="sm" 
                disabled={isSelectingAccount}
                className="min-w-[80px]"
              >
                Select
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t space-y-2">
          <Button
            variant="outline"
            onClick={() => setStep('connect')}
            className="w-full"
            disabled={isSelectingAccount}
          >
            Back to Connection
          </Button>
          <Button
            variant="ghost"
            onClick={handleDisconnect}
            className="w-full text-sm text-gray-600"
            disabled={isSelectingAccount}
          >
            Disconnect Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnection;
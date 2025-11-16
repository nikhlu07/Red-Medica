import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Play, Wallet, Package, QrCode, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences, isWalletConnected, blockchainUser } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Red Médica',
      description: 'Your blockchain-powered medical supply chain platform',
      icon: <Package className="h-8 w-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Red Médica uses blockchain technology to create an immutable record of every medical product,
            ensuring authenticity and preventing counterfeit drugs from entering the supply chain.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Benefits:</h4>
            <ul className="space-y-1 text-blue-800 text-sm">
              <li>• Complete supply chain transparency</li>
              <li>• Instant product verification</li>
              <li>• Counterfeit drug prevention</li>
              <li>• Regulatory compliance</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'wallet',
      title: 'Connect Your Wallet',
      description: 'Secure blockchain interaction through your digital wallet',
      icon: <Wallet className="h-8 w-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            To interact with the blockchain, you'll need to connect a digital wallet.
            We support MetaMask and Polkadot.js extension.
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Your wallet is used to:</h4>
            <ul className="space-y-1 text-green-800 text-sm">
              <li>• Sign blockchain transactions</li>
              <li>• Prove your identity</li>
              <li>• Authorize product operations</li>
              <li>• Pay transaction fees (gas)</li>
            </ul>
          </div>
          {!isWalletConnected && !blockchainUser && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-yellow-800 text-sm">
                💡 Don't have a wallet? We'll guide you through the setup process.
              </p>
            </div>
          )}
        </div>
      ),
      action: {
        label: isWalletConnected || blockchainUser ? 'Wallet Connected ✓' : 'Connect Wallet',
        onClick: () => navigate('/connect'),
      },
    },
    {
      id: 'roles',
      title: 'Choose Your Role',
      description: 'Different roles have different capabilities in the system',
      icon: <Users className="h-8 w-8 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Red Médica supports different user roles, each with specific permissions and workflows:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-900">Manufacturer</h4>
              <p className="text-blue-800 text-sm">Register products, generate QR codes</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-semibold text-green-900">Distributor</h4>
              <p className="text-green-800 text-sm">Receive and transfer product custody</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <h4 className="font-semibold text-orange-900">Pharmacy</h4>
              <p className="text-orange-800 text-sm">Final custody, dispense to patients</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <h4 className="font-semibold text-purple-900">Patient</h4>
              <p className="text-purple-800 text-sm">Verify product authenticity</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'verification',
      title: 'Product Verification',
      description: 'Learn how to verify product authenticity',
      icon: <QrCode className="h-8 w-8 text-orange-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Every authentic product has a unique QR code that links to its blockchain record.
            Scanning this code instantly verifies the product's authenticity.
          </p>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">Verification Process:</h4>
            <ol className="space-y-1 text-orange-800 text-sm list-decimal list-inside">
              <li>Scan the QR code on the product</li>
              <li>System queries the blockchain</li>
              <li>View complete supply chain history</li>
              <li>Confirm product authenticity</li>
            </ol>
          </div>
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <p className="text-red-800 text-sm">
              ⚠️ If a product cannot be verified, it may be counterfeit. Report suspicious products immediately.
            </p>
          </div>
        </div>
      ),
      action: {
        label: 'Try Verification',
        onClick: () => navigate('/verify'),
      },
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start using Red Médica to secure your supply chain',
      icon: <Check className="h-8 w-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Congratulations! You're now ready to use Red Médica. Here are some next steps:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-semibold">Explore the Dashboard</h4>
                <p className="text-sm text-gray-600">View your products and analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <QrCode className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-semibold">Verify a Product</h4>
                <p className="text-sm text-gray-600">Test the verification system</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Play className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-semibold">Watch Tutorials</h4>
                <p className="text-sm text-gray-600">Learn advanced features</p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Go to Dashboard',
        onClick: () => navigate('/dashboard'),
      },
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      updatePreferences({
        onboarding: {
          ...preferences?.onboarding,
          currentStep: currentStep + 1,
          completedSteps: [...(preferences?.onboarding?.completedSteps || []), steps[currentStep].id],
        },
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    updatePreferences({
      onboarding: {
        ...preferences?.onboarding,
        completed: true,
        completedSteps: steps.map(step => step.id),
      },
    });
    setIsVisible(false);
  };

  const handleSkip = () => {
    updatePreferences({
      onboarding: {
        ...preferences?.onboarding,
        skipped: true,
      },
    });
    setIsVisible(false);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                <p className="text-gray-600 text-sm">{currentStepData.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStepData.content}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStepData.action && (
                <Button
                  variant="outline"
                  onClick={currentStepData.action.onClick}
                  className="mr-2"
                >
                  {currentStepData.action.label}
                </Button>
              )}

              {currentStep === steps.length - 1 ? (
                <Button onClick={handleComplete} className="flex items-center gap-2">
                  Complete
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="flex items-center gap-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook to trigger onboarding
export const useOnboarding = () => {
  const { preferences, updatePreferences } = useAppStore();

  const startOnboarding = () => {
    updatePreferences({
      onboarding: {
        completed: false,
        currentStep: 0,
        skipped: false,
        completedSteps: [],
      },
    });
  };

  const resetOnboarding = () => {
    updatePreferences({
      onboarding: {
        completed: false,
        currentStep: 0,
        skipped: false,
        completedSteps: [],
      },
    });
  };

  return {
    isOnboardingCompleted: preferences?.onboarding?.completed || false,
    isOnboardingSkipped: preferences?.onboarding?.skipped || false,
    startOnboarding,
    resetOnboarding,
  };
};
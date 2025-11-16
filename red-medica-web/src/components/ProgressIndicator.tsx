import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface ProgressIndicatorProps {
  steps: Step[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
}

export const ProgressIndicator = ({ 
  steps, 
  className,
  orientation = 'horizontal',
  showDescriptions = true
}: ProgressIndicatorProps) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={cn(
      "w-full",
      isHorizontal ? "flex items-center justify-between" : "space-y-4",
      className
    )}>
      {steps.map((step, index) => (
        <div key={step.id} className={cn(
          "flex items-center",
          isHorizontal ? "flex-col text-center" : "flex-row space-x-4",
          isHorizontal && index < steps.length - 1 ? "flex-1" : ""
        )}>
          {/* Step Icon */}
          <div className={cn(
            "relative flex items-center justify-center rounded-full border-2 transition-all duration-300",
            step.status === 'completed' 
              ? "bg-success border-success text-success-foreground animate-scale-in" 
              : step.status === 'current'
              ? "bg-primary border-primary text-primary-foreground animate-glow"
              : step.status === 'error'
              ? "bg-destructive border-destructive text-destructive-foreground"
              : "bg-background border-muted-foreground/30 text-muted-foreground",
            isHorizontal ? "w-10 h-10 mb-2" : "w-8 h-8 flex-shrink-0"
          )}>
            {step.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : step.status === 'current' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step.status === 'error' ? (
              <Circle className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>

          {/* Step Content */}
          <div className={cn(
            "flex-1",
            isHorizontal ? "text-center" : "text-left"
          )}>
            <h4 className={cn(
              "font-medium transition-colors duration-200",
              step.status === 'completed' || step.status === 'current'
                ? "text-foreground"
                : "text-muted-foreground",
              isHorizontal ? "text-sm" : "text-base"
            )}>
              {step.title}
            </h4>
            {showDescriptions && step.description && (
              <p className={cn(
                "text-muted-foreground transition-colors duration-200",
                isHorizontal ? "text-xs mt-1" : "text-sm mt-1"
              )}>
                {step.description}
              </p>
            )}
          </div>

          {/* Connector Line */}
          {isHorizontal && index < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 mx-4 transition-colors duration-300",
              steps[index + 1].status === 'completed' || steps[index + 1].status === 'current'
                ? "bg-primary"
                : "bg-muted-foreground/30"
            )} />
          )}
        </div>
      ))}
    </div>
  );
};

// Preset configurations for common workflows
export const createRegistrationSteps = (currentStep: number): Step[] => [
  {
    id: 'connect',
    title: 'Connect Wallet',
    description: 'Connect your blockchain wallet',
    status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'current' : 'pending'
  },
  {
    id: 'details',
    title: 'Product Details',
    description: 'Enter product information',
    status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending'
  },
  {
    id: 'blockchain',
    title: 'Blockchain Registration',
    description: 'Submit to blockchain',
    status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending'
  },
  {
    id: 'qr',
    title: 'Generate QR Codes',
    description: 'Create verification codes',
    status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending'
  }
];

export const createVerificationSteps = (currentStep: number): Step[] => [
  {
    id: 'scan',
    title: 'Scan QR Code',
    description: 'Scan or enter product ID',
    status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'current' : 'pending'
  },
  {
    id: 'query',
    title: 'Query Blockchain',
    description: 'Verify on blockchain',
    status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending'
  },
  {
    id: 'results',
    title: 'View Results',
    description: 'Authentication results',
    status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending'
  }
];
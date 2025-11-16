import { Loader2, Shield, Activity } from "lucide-react";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  variant?: 'default' | 'medical' | 'blockchain';
  fullScreen?: boolean;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Loading...', 
  variant = 'default',
  fullScreen = true 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = fullScreen 
    ? "flex items-center justify-center min-h-screen" 
    : "flex items-center justify-center p-8";

  const renderIcon = () => {
    switch (variant) {
      case 'medical':
        return <Shield className={`${sizeClasses[size]} animate-spin text-primary`} />;
      case 'blockchain':
        return <Activity className={`${sizeClasses[size]} animate-pulse text-primary`} />;
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />;
    }
  };

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        <div className="relative">
          {renderIcon()}
          {variant === 'blockchain' && (
            <div className="absolute inset-0 animate-ping">
              <Activity className={`${sizeClasses[size]} text-primary/30`} />
            </div>
          )}
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground animate-pulse-soft">{message}</p>
          {variant === 'blockchain' && (
            <p className="text-xs text-muted-foreground/70">Connecting to blockchain...</p>
          )}
        </div>
        
        {/* Loading dots animation */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};
import { ReactNode } from 'react';
import { HelpCircle, Info, Lightbulb } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/store';

interface HelpTooltipProps {
  content: string | ReactNode;
  title?: string;
  type?: 'info' | 'help' | 'tip';
  side?: 'top' | 'right' | 'bottom' | 'left';
  children?: ReactNode;
  showIcon?: boolean;
  className?: string;
}

export const HelpTooltip = ({
  content,
  title,
  type = 'help',
  side = 'top',
  children,
  showIcon = true,
  className = '',
}: HelpTooltipProps) => {
  const { preferences } = useAppStore();

  // Don't render if tooltips are disabled
  if (!preferences?.help?.tooltipsEnabled) {
    return <>{children}</>;
  }

  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'tip':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'info':
        return 'text-blue-500 hover:text-blue-600';
      case 'tip':
        return 'text-yellow-500 hover:text-yellow-600';
      default:
        return 'text-gray-500 hover:text-gray-600';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children ? (
          <div className={`inline-flex items-center gap-2 ${className}`}>
            {children}
            {showIcon && (
              <button
                type="button"
                className={`transition-colors ${getIconColor()}`}
                aria-label="Help"
              >
                {getIcon()}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className={`transition-colors ${getIconColor()} ${className}`}
            aria-label="Help"
          >
            {getIcon()}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        {title && (
          <div className="font-semibold text-sm mb-1">{title}</div>
        )}
        <div className="text-sm">{content}</div>
      </TooltipContent>
    </Tooltip>
  );
};

// Predefined help tooltips for common use cases
export const WalletHelpTooltip = () => (
  <HelpTooltip
    title="Wallet Connection"
    content="Connect your MetaMask or Polkadot.js wallet to interact with the blockchain. Your wallet is used to sign transactions and prove your identity."
    type="info"
  />
);

export const QRCodeHelpTooltip = () => (
  <HelpTooltip
    title="QR Code Verification"
    content="Scan the QR code on the product packaging to verify its authenticity. Each QR code is unique and linked to the blockchain record."
    type="info"
  />
);

export const ProductRegistrationHelpTooltip = () => (
  <HelpTooltip
    title="Product Registration"
    content="Register your products on the blockchain to create an immutable record. This enables supply chain tracking and authenticity verification."
    type="info"
  />
);

export const CustodyTransferHelpTooltip = () => (
  <HelpTooltip
    title="Custody Transfer"
    content="Transfer product custody to the next party in the supply chain. This creates a permanent record of the product's journey."
    type="info"
  />
);

export const BlockchainStatusHelpTooltip = () => (
  <HelpTooltip
    title="Blockchain Status"
    content="Shows your connection status to the Moonbase Alpha testnet. Green means connected, red means disconnected."
    type="info"
  />
);
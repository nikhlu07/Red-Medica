/**
 * Ethereum/MetaMask type declarations
 */

interface EthereumProvider {
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
  isMetaMask?: boolean;
  chainId?: string;
  selectedAddress?: string;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
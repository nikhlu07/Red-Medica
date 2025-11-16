import { cn } from '@/lib/utils';
import { Product } from '@/lib/mockData';

interface StatusBadgeProps {
  status: Product['status'];
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const variants = {
    'Manufactured': 'bg-primary/10 text-primary border-primary/20',
    'In Transit': 'bg-warning/10 text-warning border-warning/20',
    'At Distributor': 'bg-accent/10 text-accent border-accent/20',
    'At Pharmacy': 'bg-secondary/10 text-secondary border-secondary/20',
    'Delivered': 'bg-success/10 text-success border-success/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[status],
        className
      )}
    >
      {status}
    </span>
  );
};

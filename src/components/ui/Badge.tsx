import { cn, getRiskColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'risk';
  risk?: 'Low' | 'Medium' | 'High';
  className?: string;
}

export function Badge({ children, variant = 'default', risk, className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    risk: '',
  };

  const badgeClass = variant === 'risk' && risk 
    ? getRiskColor(risk) 
    : variants[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        badgeClass,
        className
      )}
    >
      {children}
    </span>
  );
}

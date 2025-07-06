import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  if (text) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8">
        <Loader2 className={cn(sizeClasses[size], 'animate-spin', className)} />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={cn(sizeClasses[size], 'animate-spin', className)} />
    </div>
  );
};

export default LoadingSpinner;
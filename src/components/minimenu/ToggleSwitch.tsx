'use client';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function ToggleSwitch({ 
  checked, 
  onCheckedChange, 
  disabled = false, 
  className,
  label 
}: ToggleSwitchProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-purple-600"
      />
      {label && (
        <span className={cn(
          'text-sm font-medium',
          disabled ? 'text-gray-400' : 'text-gray-700'
        )}>
          {label}
        </span>
      )}
    </div>
  );
}

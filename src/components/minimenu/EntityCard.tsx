'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { ToggleSwitch } from './ToggleSwitch';
import * as Icons from 'lucide-react';

interface EntityCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending_payment';
  type?: 'core' | 'addon';
  price?: number;
  currency?: string;
  billingType?: string;
  features?: string[];
  color?: string;
  isActive?: boolean;
  onToggle?: (checked: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  toggleDisabled?: boolean;
  children?: React.ReactNode;
}

export function EntityCard({
  title,
  subtitle,
  description,
  icon,
  status,
  type,
  price,
  currency = 'COP',
  billingType,
  features,
  color,
  isActive,
  onToggle,
  onEdit,
  onDelete,
  toggleDisabled = false,
  children
}: EntityCardProps) {
  const formatPrice = (price: number, curr: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0
    }).format(price);
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    const iconNamePascal = iconName.split('-').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('');
    const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconNamePascal];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  const billingTypeLabels: Record<string, string> = {
    monthly: 'mensual',
    one_time: 'único',
    yearly: 'anual',
    lifetime: 'vitalicio'
  };

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color ? `${color}20` : '#8b5cf620' }}
              >
                {getIconComponent(icon)}
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status && <StatusBadge status={status} />}
            {type && (
              <Badge variant="outline" className={type === 'core' ? 'border-purple-300 text-purple-700' : 'border-blue-300 text-blue-700'}>
                {type === 'core' ? 'Core' : 'Addon'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-gray-600 text-sm">{description}</p>
        )}
        
        {price !== undefined && (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(price, currency)}</span>
            {billingType && (
              <span className="text-gray-500 text-sm">/ {billingTypeLabels[billingType] || billingType}</span>
            )}
          </div>
        )}
        
        {features && features.length > 0 && (
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <Icons.Check className="w-4 h-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        )}
        
        {children}
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {(isActive !== undefined && onToggle) && (
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={isActive}
                onCheckedChange={onToggle}
                disabled={toggleDisabled}
              />
              <span className="text-sm text-gray-600">
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Icons.Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Icons.Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EntityStatus, ServiceStatus, ModuleStatus, OrderStatus } from '@/types';

type StatusType = EntityStatus | ServiceStatus | ModuleStatus | OrderStatus;

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  suspended: { label: 'Suspendido', className: 'bg-red-100 text-red-800 border-red-200' },
  pending_payment: { label: 'Pago Pendiente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  preparing: { label: 'Preparando', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  ready: { label: 'Listo', className: 'bg-green-100 text-green-800 border-green-200' },
  delivered: { label: 'Entregado', className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' }
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-800' };
  
  return (
    <Badge 
      variant="outline" 
      className={cn('font-medium capitalize', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

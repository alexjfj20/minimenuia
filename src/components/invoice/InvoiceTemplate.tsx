'use client';

import React from 'react';
import type { InvoiceSettingsType, OrderType } from '@/types/invoice';
import { cn } from '@/lib/utils';

export interface InvoiceTemplateProps {
  config: InvoiceSettingsType;
  order: OrderType;
  allBoldOverride?: boolean;
  isPreview?: boolean;
}

export default function InvoiceTemplate({
  config,
  order,
  allBoldOverride,
  isPreview = false
}: InvoiceTemplateProps) {
  // Helper to determine if text should be bold
  const isBold = (zone: keyof InvoiceSettingsType['bold']['zones']): boolean => {
    if (allBoldOverride !== undefined) return allBoldOverride;
    if (config.bold.allBold) return true;
    return config.bold.zones[zone] ?? false;
  };

  // Get font family
  const getFontFamily = (): string => {
    switch (config.style.font) {
      case 'arial':
        return 'font-sans';
      case 'sans-serif':
        return 'font-sans';
      case 'monospace':
      default:
        return 'font-mono';
    }
  };

  // Get paper width
  const getPaperWidth = (): string => {
    switch (config.style.paperSize) {
      case '58mm':
        return 'max-w-[58mm]';
      case 'A4':
        return 'max-w-[210mm]';
      case '80mm':
      default:
        return 'max-w-[80mm]';
    }
  };

  // Get separator style
  const getSeparatorClass = (): string => {
    switch (config.style.separatorStyle) {
      case 'solid':
        return 'border-t-2 border-black';
      case 'dashed':
        return 'border-t border-dashed border-black';
      case 'none':
      default:
        return '';
    }
  };

  const paperWidth = getPaperWidth();
  const fontFamily = getFontFamily();
  const separatorClass = getSeparatorClass();
  const fontSize = config.style.fontSize;

  return (
    <div
      className={cn(
        'bg-white text-black mx-auto p-4 invoice-print-root',
        paperWidth,
        fontFamily
      )}
      style={{ fontSize }}
    >
      {/* Logo */}
      {config.logo.url && (
        <div className={cn(
          'mb-2',
          config.logo.position === 'center' && 'text-center',
          config.logo.position === 'left' && 'text-left',
          config.logo.position === 'right' && 'text-right'
        )}>
          <img
            src={config.logo.url}
            alt="Logo"
            style={{ width: config.logo.size, height: 'auto' }}
            className="inline-block"
          />
        </div>
      )}

      {/* Business Header */}
      <div className="text-center mb-2">
        <p className={cn(isBold('businessName') && 'font-bold')}>
          {config.header.businessName || 'NOMBRE DEL NEGOCIO'}
        </p>
        <p className={cn('text-xs', isBold('address') && 'font-bold')}>
          {config.header.address || 'Dirección del negocio'}
        </p>
        <p className={cn('text-xs', isBold('nit') && 'font-bold')}>
          NIT: {config.header.nit || '000-000000-0'}
        </p>
      </div>

      {/* Separator */}
      <div className={cn('my-2', separatorClass)} />

      {/* Invoice Info */}
      <div className="mb-2">
        {config.fields.showInvoiceNumber && (
          <p className={cn(isBold('invoiceNumber') && 'font-bold')}>
            Factura: {order.invoiceNumber || 'FAC-0000'}
          </p>
        )}
        {config.fields.showDateTime && (
          <p className={cn('text-xs', isBold('dateTime') && 'font-bold')}>
            Fecha: {order.dateTime || new Date().toLocaleString()}
          </p>
        )}
      </div>

      {/* Client Info */}
      <div className="mb-2">
        <p className={cn(isBold('clientName') && 'font-bold')}>
          Cliente: {order.customerName || 'Cliente Genérico'}
        </p>
        {config.fields.showClientPhone && order.customerPhone && (
          <p className={cn('text-xs', isBold('clientPhone') && 'font-bold')}>
            Teléfono: {order.customerPhone}
          </p>
        )}
        {config.fields.showClientAddress && order.customerAddress && (
          <p className={cn('text-xs', isBold('clientAddress') && 'font-bold')}>
            Dirección: {order.customerAddress}
          </p>
        )}
      </div>

      {/* Separator */}
      <div className={cn('my-2', separatorClass)} />

      {/* Items */}
      <div className="mb-2">
        <p className={cn(isBold('items') && 'font-bold')}>Productos:</p>
        <div className="mt-1">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-xs mb-1">
              <span>
                {item.quantity} x {item.productName}
                {item.notes && <span className="text-gray-600"> ({item.notes})</span>}
              </span>
              <span>${item.totalPrice.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className={cn('my-2', separatorClass)} />

      {/* Totals */}
      <div className="mb-2">
        <div className="flex justify-between text-xs">
          <span className={cn(isBold('subtotalFees') && 'font-bold')}>Subtotal:</span>
          <span className={cn(isBold('subtotalFees') && 'font-bold')}>
            ${order.subtotal.toLocaleString()}
          </span>
        </div>
        {config.fields.showDeliveryFee && order.deliveryFee > 0 && (
          <div className="flex justify-between text-xs">
            <span className={cn(isBold('subtotalFees') && 'font-bold')}>Domicilio:</span>
            <span className={cn(isBold('subtotalFees') && 'font-bold')}>
              ${order.deliveryFee.toLocaleString()}
            </span>
          </div>
        )}
        {config.fields.showPackaging && order.packagingFee > 0 && (
          <div className="flex justify-between text-xs">
            <span className={cn(isBold('subtotalFees') && 'font-bold')}>Empaque:</span>
            <span className={cn(isBold('subtotalFees') && 'font-bold')}>
              ${order.packagingFee.toLocaleString()}
            </span>
          </div>
        )}
        {order.tax > 0 && (
          <div className="flex justify-between text-xs">
            <span className={cn(isBold('subtotalFees') && 'font-bold')}>Impuesto:</span>
            <span className={cn(isBold('subtotalFees') && 'font-bold')}>
              ${order.tax.toLocaleString()}
            </span>
          </div>
        )}
        <div className={cn('flex justify-between mt-1', isBold('total') && 'font-bold')}>
          <span>Total:</span>
          <span>${order.total.toLocaleString()}</span>
        </div>
        {config.fields.showPaymentMethod && (
          <p className="text-xs mt-1">
            Pago: {order.paymentMethod || 'Efectivo'}
          </p>
        )}
        {config.fields.showEstimatedDelivery && order.estimatedDelivery && (
          <p className={cn('text-xs', isBold('estimatedDelivery') && 'font-bold')}>
            Entrega estimada: {order.estimatedDelivery}
          </p>
        )}
      </div>

      {/* Promo */}
      {config.promo.show && config.promo.text && (
        <>
          <div className={cn('my-2', separatorClass)} />
          <p className="text-center text-xs font-bold mb-2">{config.promo.text}</p>
        </>
      )}

      {/* QR Code */}
      {config.qr.show && (
        <>
          <div className={cn('my-2', separatorClass)} />
          <div className="text-center mb-2">
            {config.qr.linkType === 'image' && config.qr.customImageUrl ? (
              <div className="mb-1">
                <img
                  src={config.qr.customImageUrl}
                  alt="Custom QR Code"
                  className="inline-block w-20 h-20 object-contain"
                />
              </div>
            ) : config.qr.url ? (
              <div className="mb-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(config.qr.url)}`}
                  alt="QR Code"
                  className="inline-block w-20 h-20"
                />
              </div>
            ) : null}
            <p className={cn('text-xs', isBold('qrText') && 'font-bold')}>
              {config.qr.labelText}
            </p>
          </div>
        </>
      )}

      {/* Social Media */}
      {config.socialMedia.show && (
        <>
          <div className={cn('my-2', separatorClass)} />
          <div className="text-center mb-2">
            <p className={cn('text-xs mb-1', isBold('socialMedia') && 'font-bold')}>
              Síguenos:
            </p>
            <div className="flex justify-center gap-2 text-xs">
              {config.socialMedia.instagram && (
                <span>📷 @{config.socialMedia.instagram}</span>
              )}
              {config.socialMedia.whatsapp && (
                <span>💬 {config.socialMedia.whatsapp}</span>
              )}
              {config.socialMedia.facebook && (
                <span>👍 {config.socialMedia.facebook}</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <>
        <div className={cn('my-2', separatorClass)} />
        <div className="text-center mb-2">
          {config.footer.repeatBusinessName && (
            <p className={cn('text-xs', isBold('footer') && 'font-bold')}>
              {config.header.businessName}
            </p>
          )}
          <p className={cn('text-xs', isBold('footer') && 'font-bold')}>
            {config.footer.message || '¡Gracias por su compra!'}
          </p>
        </div>
      </>
    </div>
  );
}

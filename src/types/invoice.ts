// =============================================
// MINIMENU - Invoice Settings Types
// =============================================

// Logo configuration
export interface InvoiceLogoSettings {
  url: string;
  size: '40px' | '60px' | '80px';
  position: 'center' | 'left' | 'right';
}

// QR configuration
export interface InvoiceQRSettings {
  show: boolean;
  linkType: 'menu' | 'review' | 'whatsapp' | 'instagram' | 'custom' | 'image';
  url: string;
  labelText: string;
  customImageUrl?: string;
}

// Social media configuration
export interface InvoiceSocialMediaSettings {
  show: boolean;
  instagram: string;
  whatsapp: string;
  facebook: string;
}

// Visible fields configuration
export interface InvoiceFieldsSettings {
  showInvoiceNumber: boolean;
  showDateTime: boolean;
  showClientAddress: boolean;
  showClientPhone: boolean;
  showPaymentMethod: boolean;
  showDeliveryFee: boolean;
  showPackaging: boolean;
  showEstimatedDelivery: boolean;
}

// Style configuration
export interface InvoiceStyleSettings {
  paperSize: '58mm' | '80mm' | 'A4';
  font: 'monospace' | 'arial' | 'sans-serif';
  fontSize: '9px' | '10px' | '11px' | '12px';
  separatorStyle: 'dashed' | 'solid' | 'none';
}

// Bold zones configuration
export interface InvoiceBoldZonesSettings {
  businessName: boolean;
  address: boolean;
  nit: boolean;
  invoiceNumber: boolean;
  dateTime: boolean;
  clientName: boolean;
  clientPhone: boolean;
  clientAddress: boolean;
  paymentMethod: boolean;
  estimatedDelivery: boolean;
  items: boolean;
  total: boolean;
  subtotalFees: boolean;
  qrText: boolean;
  socialMedia: boolean;
  footer: boolean;
}

// Bold configuration
export interface InvoiceBoldSettings {
  allBold: boolean;
  zones: InvoiceBoldZonesSettings;
}

// Promo configuration
export interface InvoicePromoSettings {
  show: boolean;
  text: string;
}

// Footer configuration
export interface InvoiceFooterSettings {
  message: string;
  repeatBusinessName: boolean;
}

// Header configuration
export interface InvoiceHeaderSettings {
  businessName: string;
  address: string;
  phone: string;
  nit: string;
}

// Complete invoice settings structure
export interface InvoiceSettingsType {
  header: InvoiceHeaderSettings;
  logo: InvoiceLogoSettings;
  qr: InvoiceQRSettings;
  socialMedia: InvoiceSocialMediaSettings;
  fields: InvoiceFieldsSettings;
  style: InvoiceStyleSettings;
  bold: InvoiceBoldSettings;
  promo: InvoicePromoSettings;
  footer: InvoiceFooterSettings;
}

// Order type for invoice preview
export interface OrderItemType {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
}

export interface OrderType {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItemType[];
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  tax: number;
  total: number;
  paymentMethod: string;
  dateTime: string;
  estimatedDelivery: string;
  notes: string | null;
}

// Invoice template props
export interface InvoiceTemplateProps {
  config: InvoiceSettingsType;
  order: OrderType;
  allBoldOverride?: boolean;
}

// Database row type for invoice_settings_business
export interface InvoiceSettingsBusinessRow {
  id: string;
  business_id: string;
  settings: InvoiceSettingsType;
  updated_at: string;
}

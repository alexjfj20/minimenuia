'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering to avoid SSR issues with hooks
export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/contexts/ToastContext';
import type { InvoiceSettingsType, OrderType } from '@/types/invoice';
import InvoiceTemplate from '@/components/invoice/InvoiceTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Upload,
  Printer,
  Save,
  ChevronDown,
  ChevronRight,
  Type,
  Image as ImageIcon,
  QrCode,
  Share2,
  LayoutTemplate,
  Palette,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Default invoice settings
const getDefaultSettings = (): InvoiceSettingsType => ({
  header: {
    businessName: '',
    address: '',
    phone: '',
    nit: ''
  },
  logo: {
    url: '',
    size: '60px',
    position: 'center'
  },
  qr: {
    show: true,
    linkType: 'menu',
    url: '',
    labelText: 'Ver nuestro menú',
    customImageUrl: ''
  },
  socialMedia: {
    show: false,
    instagram: '',
    whatsapp: '',
    facebook: ''
  },
  fields: {
    showInvoiceNumber: true,
    showDateTime: true,
    showClientAddress: true,
    showClientPhone: true,
    showPaymentMethod: true,
    showDeliveryFee: true,
    showPackaging: false,
    showEstimatedDelivery: true
  },
  style: {
    paperSize: '80mm',
    font: 'monospace',
    fontSize: '10px',
    separatorStyle: 'dashed'
  },
  bold: {
    allBold: false,
    zones: {
      businessName: true,
      address: true,
      nit: false,
      invoiceNumber: true,
      dateTime: false,
      clientName: false,
      clientPhone: false,
      clientAddress: false,
      paymentMethod: false,
      estimatedDelivery: false,
      items: true,
      total: true,
      subtotalFees: false,
      qrText: false,
      socialMedia: false,
      footer: true
    }
  },
  promo: {
    show: false,
    text: ''
  },
  footer: {
    message: '¡Gracias por su compra!',
    repeatBusinessName: true
  }
});

// Mock order for preview
const mockOrder: OrderType = {
  id: 'preview-order-1',
  invoiceNumber: 'FAC-0001',
  customerName: 'Juan Pérez',
  customerPhone: '300 123 4567',
  customerAddress: 'Calle 123 #45-67',
  items: [
    { productId: '1', productName: 'Hamburguesa Clásica', quantity: 2, unitPrice: 25000, totalPrice: 50000, notes: null },
    { productId: '2', productName: 'Papas Fritas', quantity: 1, unitPrice: 12000, totalPrice: 12000, notes: 'Sin sal' },
    { productId: '3', productName: 'Gaseosa 500ml', quantity: 2, unitPrice: 5000, totalPrice: 10000, notes: null }
  ],
  subtotal: 72000,
  deliveryFee: 5000,
  packagingFee: 2000,
  tax: 0,
  total: 79000,
  paymentMethod: 'Efectivo',
  dateTime: new Date().toLocaleString(),
  estimatedDelivery: '30-45 min',
  notes: null
};

export default function InvoiceEditorPage() {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [settings, setSettings] = useState<InvoiceSettingsType>(getDefaultSettings());
  const [allBoldPreview, setAllBoldPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    header: true,
    logo: false,
    qr: false,
    social: false,
    fields: false,
    bold: false,
    style: false,
    promo: false,
    footer: false
  });

  // Load auth state and settings on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.success && data.data) {
          setIsAuthenticated(true);
          setBusinessId(data.data.businessId);
          
          if (data.data.businessId) {
            await loadSettings(data.data.businessId);
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('[Invoice Editor] Auth error:', error);
        router.push('/');
      }
    };

    initAuth();
  }, []);

  const loadSettings = async (bid: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/business/invoice-settings?businessId=${bid}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSettings(result.data);
      } else if (!result.success) {
        console.warn('[Invoice Editor] Error loading settings from API:', result.error);
      }
    } catch (error) {
      const err = error as Error;
      console.error('[Invoice Editor] Error loading settings:', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessId) return;

    setSaving(true);
    try {
      const response = await fetch('/api/business/invoice-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          settings,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar');
      }

      toast.showSuccess('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      const err = error as Error;
      console.error('[Invoice Editor] Error saving:', err.message);
      toast.showError('Error', `Error al guardar la configuración: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !businessId) return;

    // Validate file
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.showError('Error', 'Solo se permiten archivos PNG, JPG o SVG');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.showError('Error', 'El archivo no puede superar los 2MB');
      return;
    }

    try {
      // Upload to Supabase Storage
      const fileName = `logo-${businessId}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoice-logos')
        .upload(fileName, file, { upsert: true });

      // Handle error if upload failed
      if (uploadError) {
        const errorObj = uploadError as unknown as Record<string, unknown>;
        console.error('[Invoice Editor] Upload error:', errorObj);
        
        const errorMessage = typeof errorObj.message === 'string' ? errorObj.message : 'Error desconocido al subir';
        const statusCode = typeof errorObj.statusCode === 'string' ? errorObj.statusCode : '';
        
        // Check if bucket doesn't exist
        if (statusCode === '404' || errorMessage.toLowerCase().includes('bucket')) {
          toast.showError('Error', 'El bucket de almacenamiento no está configurado. Contacta al administrador.');
          return;
        }
        
        throw new Error(errorMessage);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoice-logos')
        .getPublicUrl(fileName);

      setSettings(prev => ({
        ...prev,
        logo: {
          ...prev.logo,
          url: publicUrl || ''
        }
      }));

      toast.showSuccess('Éxito', 'Logo subido correctamente');
    } catch (error) {
      // Handle any error (including exceptions thrown by Supabase)
      const err = error as Record<string, unknown>;
      const errorMessage = typeof err.message === 'string' ? err.message : String(err);
      
      console.error('[Invoice Editor] Logo upload error:', {
        message: errorMessage,
        name: typeof err.name === 'string' ? err.name : undefined,
        stack: typeof err.stack === 'string' ? err.stack : undefined
      });
      
      // Show specific error message based on the error type
      if (errorMessage.includes('bucket') || errorMessage.includes('Bucket')) {
        toast.showError('Error', 'El bucket invoice-logos no existe. Ejecuta el script supabase-create-invoice-logos-bucket.sql');
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('permission')) {
        toast.showError('Error', 'No tienes permisos para subir archivos. Verifica las políticas del bucket.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.showError('Error', 'Error de conexión. Verifica tu internet.');
      } else {
        toast.showError('Error', `Error al subir el logo: ${errorMessage.slice(0, 100)}`);
      }
    }
  };

  const handleQRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !businessId) return;

    // Validate file
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.showError('Error', 'Solo se permiten archivos PNG, JPG o SVG');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.showError('Error', 'El archivo no puede superar los 2MB');
      return;
    }

    try {
      // Upload to Supabase Storage - Use a different prefix for QR
      const fileName = `qr-${businessId}-${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoice-logos')
        .upload(fileName, file, { upsert: true });

      // Handle error if upload failed
      if (uploadError) {
        const errorObj = uploadError as unknown as Record<string, unknown>;
        console.error('[Invoice Editor] QR Upload error:', errorObj);
        throw new Error(typeof errorObj.message === 'string' ? errorObj.message : 'Error al subir QR');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoice-logos')
        .getPublicUrl(fileName);

      setSettings(prev => ({
        ...prev,
        qr: {
          ...prev.qr,
          customImageUrl: publicUrl || ''
        }
      }));

      toast.showSuccess('Éxito', 'Imagen de QR subida correctamente');
    } catch (error) {
      const err = error as Error;
      console.error('[Invoice Editor] QR upload error:', err.message);
      toast.showError('Error', `Error al subir el QR: ${err.message}`);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleBoldZone = (zone: keyof InvoiceSettingsType['bold']['zones']) => {
    setSettings(prev => ({
      ...prev,
      bold: {
        ...prev.bold,
        zones: {
          ...prev.bold.zones,
          [zone]: !prev.bold.zones[zone]
        }
      }
    }));
  };

  const setAllBoldZones = (value: boolean) => {
    setSettings(prev => ({
      ...prev,
      bold: {
        ...prev.bold,
        allBold: value,
        zones: Object.keys(prev.bold.zones).reduce((acc, key) => ({
          ...acc,
          [key as keyof InvoiceSettingsType['bold']['zones']]: value
        }), {} as InvoiceSettingsType['bold']['zones'])
      }
    }));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceContent = document.getElementById('invoice-preview');
    if (!invoiceContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Factura</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: ${settings.style.font === 'monospace' ? 'monospace' : 'sans-serif'}; 
              font-size: ${settings.style.fontSize}; 
              background: white;
              color: black;
              display: flex;
              justify-content: center;
              padding: 10px;
            }
            .invoice-print-root { 
              width: 100%; 
              max-width: ${settings.style.paperSize === '58mm' ? '58mm' : settings.style.paperSize === 'A4' ? '190mm' : '80mm'};
              background: white !important;
              color: black !important;
              padding: 4mm !important;
              margin: 0 auto !important;
            }
            .font-mono { font-family: monospace !important; }
            .font-sans { font-family: sans-serif !important; }
            
            /* Tailwind Emulator Classes */
            .flex { display: flex !important; }
            .justify-between { justify-content: space-between !important; }
            .justify-center { justify-content: center !important; }
            .items-center { align-items: center !important; }
            .text-center { text-align: center !important; }
            .text-left { text-align: left !important; }
            .text-right { text-align: right !important; }
            .text-xs { font-size: 0.85em !important; }
            .font-bold { font-weight: bold !important; }
            .mb-1 { margin-bottom: 0.25rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .mt-1 { margin-top: 0.25rem !important; }
            .mt-2 { margin-top: 0.5rem !important; }
            .my-2 { margin: 0.5rem 0 !important; }
            .mx-auto { margin-left: auto !important; margin-right: auto !important; }
            .p-4 { padding: 1rem !important; }
            .gap-2 { gap: 0.5rem !important; }
            .inline-block { display: inline-block !important; }
            .w-20 { width: 5rem !important; height: 5rem !important; }
            .object-contain { object-fit: contain !important; }
            
            /* Border and separator styles */
            .border-t { border-top: 1px solid black !important; }
            .border-t-2 { border-top: 2px solid black !important; }
            .border-dashed { border-style: dashed !important; }
            
            @media print {
              body { padding: 0 !important; }
              @page { margin: 0; size: auto; }
              .invoice-print-root { width: 100%; border: none; }
            }
          </style>
        </head>
        <body>
          ${invoiceContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const boldZonesLabels: Record<keyof InvoiceSettingsType['bold']['zones'], string> = {
    businessName: 'Nombre negocio',
    address: 'Dirección',
    nit: 'NIT',
    invoiceNumber: 'N° Factura',
    dateTime: 'Fecha',
    clientName: 'Nombre cliente',
    clientPhone: 'Teléfono cliente',
    clientAddress: 'Dirección cliente',
    paymentMethod: 'Método de pago',
    estimatedDelivery: 'Tiempo entrega',
    items: 'Ítems/Productos',
    total: 'Total',
    subtotalFees: 'Subtotal/Fees',
    qrText: 'Texto QR',
    socialMedia: 'Redes sociales',
    footer: 'Pie de factura'
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white">Editor de Factura</h1>
          <p className="text-gray-400 mt-1">Configura el diseño de las facturas de tu negocio</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Settings */}
          <div className="space-y-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {/* Header Section */}
              <Card className="bg-gray-900 border-gray-800">
                <Collapsible open={expandedSections.header} onOpenChange={() => toggleSection('header')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSections.header ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <FileText className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-lg text-white">Encabezado</CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="businessName" className="text-white">Nombre del Negocio</Label>
                        <Input
                          id="businessName"
                          value={settings.header.businessName}
                          onChange={(e) => setSettings(prev => ({ ...prev, header: { ...prev.header, businessName: e.target.value } }))}
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                          placeholder="Mi Restaurante"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address" className="text-white">Dirección</Label>
                        <Input
                          id="address"
                          value={settings.header.address}
                          onChange={(e) => setSettings(prev => ({ ...prev, header: { ...prev.header, address: e.target.value } }))}
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                          placeholder="Calle 123 #45-67"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-white">Teléfono</Label>
                        <Input
                          id="phone"
                          value={settings.header.phone}
                          onChange={(e) => setSettings(prev => ({ ...prev, header: { ...prev.header, phone: e.target.value } }))}
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                          placeholder="+57 300 123 4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nit" className="text-white">NIT/RUT</Label>
                        <Input
                          id="nit"
                          value={settings.header.nit}
                          onChange={(e) => setSettings(prev => ({ ...prev, header: { ...prev.header, nit: e.target.value } }))}
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                          placeholder="000-000000-0"
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Logo Section */}
              <Card className="bg-gray-900 border-gray-800">
                <Collapsible open={expandedSections.logo} onOpenChange={() => toggleSection('logo')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSections.logo ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <ImageIcon className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-lg text-white">Logo</CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-white">Subir Logo</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Subir Imagen
                          </Button>
                          {settings.logo.url && (
                            <img
                              src={settings.logo.url}
                              alt="Logo preview"
                              style={{ width: settings.logo.size }}
                              className="rounded"
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-white">Tamaño del Logo</Label>
                        <Select
                          value={settings.logo.size}
                          onValueChange={(value: '40px' | '60px' | '80px') => setSettings(prev => ({ ...prev, logo: { ...prev.logo, size: value } }))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="40px">Pequeño (40px)</SelectItem>
                            <SelectItem value="60px">Mediano (60px)</SelectItem>
                            <SelectItem value="80px">Grande (80px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Posición del Logo</Label>
                        <Select
                          value={settings.logo.position}
                          onValueChange={(value: 'center' | 'left' | 'right') => setSettings(prev => ({ ...prev, logo: { ...prev.logo, position: value } }))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Izquierda</SelectItem>
                            <SelectItem value="center">Centro</SelectItem>
                            <SelectItem value="right">Derecha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* QR Section */}
              <Card className="bg-gray-900 border-gray-800">
                <Collapsible open={expandedSections.qr} onOpenChange={() => toggleSection('qr')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSections.qr ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <QrCode className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-lg text-white">Código QR</CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Mostrar QR</Label>
                        <Switch
                          checked={settings.qr.show}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, qr: { ...prev.qr, show: checked } }))}
                        />
                      </div>
                      {settings.qr.show && (
                        <>
                          <div>
                            <Label className="text-white">¿Qué enlaza el QR?</Label>
                            <Select
                              value={settings.qr.linkType}
                              onValueChange={(value: InvoiceSettingsType['qr']['linkType']) => setSettings(prev => ({ ...prev, qr: { ...prev.qr, linkType: value } }))}
                            >
                              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="menu">Menú digital</SelectItem>
                                <SelectItem value="review">Reseña Google</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="custom">Link personalizado</SelectItem>
                                <SelectItem value="image">✨ Imagen Código QR (Desde mi PC)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {settings.qr.linkType === 'image' ? (
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
                              <Label className="text-white font-semibold">Subir Código QR Personalizado</Label>
                              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-lg hover:border-purple-500/50 transition-colors">
                                <input
                                  ref={qrFileInputRef}
                                  type="file"
                                  accept="image/png,image/jpeg,image/svg+xml"
                                  onChange={handleQRUpload}
                                  className="hidden"
                                />
                                {settings.qr.customImageUrl ? (
                                  <div className="flex flex-col items-center gap-4">
                                    <img
                                      src={settings.qr.customImageUrl}
                                      alt="QR Preview"
                                      className="h-32 w-32 rounded bg-white p-2 object-contain"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => qrFileInputRef.current?.click()}
                                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Cambiar Imagen
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-gray-800 rounded-full mb-2">
                                      <Upload className="h-8 w-8 text-purple-400" />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => qrFileInputRef.current?.click()}
                                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                                    >
                                      Seleccionar Imagen QR
                                    </Button>
                                    <p className="text-xs text-gray-400 mt-2">PNG, JPG o SVG (Máx 2MB)</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <Label className="text-white">URL del QR</Label>
                              <Input
                                value={settings.qr.url}
                                onChange={(e) => setSettings(prev => ({ ...prev, qr: { ...prev.qr, url: e.target.value } }))}
                                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                                placeholder="https://..."
                              />
                            </div>
                          )}
                          <div>
                            <Label className="text-white">Texto bajo el QR</Label>
                            <Input
                              value={settings.qr.labelText}
                              onChange={(e) => setSettings(prev => ({ ...prev, qr: { ...prev.qr, labelText: e.target.value } }))}
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                              placeholder="Ver nuestro menú"
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Social Media Section */}
              <Card className="bg-gray-900 border-gray-800">
                <Collapsible open={expandedSections.social} onOpenChange={() => toggleSection('social')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSections.social ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Share2 className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-lg text-white">Redes Sociales</CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Mostrar Redes Sociales</Label>
                        <Switch
                          checked={settings.socialMedia.show}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, show: checked } }))}
                        />
                      </div>
                      {settings.socialMedia.show && (
                        <>
                          <div>
                            <Label className="text-white">Instagram</Label>
                            <Input
                              value={settings.socialMedia.instagram}
                              onChange={(e) => setSettings(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, instagram: e.target.value } }))}
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                              placeholder="@tu_restaurante"
                            />
                          </div>
                          <div>
                            <Label className="text-white">WhatsApp</Label>
                            <Input
                              value={settings.socialMedia.whatsapp}
                              onChange={(e) => setSettings(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, whatsapp: e.target.value } }))}
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                              placeholder="+57 300 123 4567"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Facebook</Label>
                            <Input
                              value={settings.socialMedia.facebook}
                              onChange={(e) => setSettings(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, facebook: e.target.value } }))}
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                              placeholder="Tu Página"
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Fields Section */}
              <Card className="bg-gray-900 border-gray-800">
                <Collapsible open={expandedSections.fields} onOpenChange={() => toggleSection('fields')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSections.fields ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <LayoutTemplate className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-lg text-white">Campos Visibles</CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {[
                        { key: 'showInvoiceNumber', label: 'N° Factura' },
                        { key: 'showDateTime', label: 'Fecha y hora' },
                        { key: 'showClientAddress', label: 'Dirección cliente' },
                        { key: 'showClientPhone', label: 'Teléfono cliente' },
                        { key: 'showPaymentMethod', label: 'Método de pago' },
                        { key: 'showDeliveryFee', label: 'Domicilio' },
                        { key: 'showPackaging', label: 'Empaque' },
                        { key: 'showEstimatedDelivery', label: 'Tiempo entrega estimado' }
                      ].map((field) => (
                        <div key={field.key} className="flex items-center justify-between">
                          <Label className="text-white">{field.label}</Label>
                          <Switch
                            checked={settings.fields[field.key as keyof InvoiceSettingsType['fields']]}
                            onCheckedChange={(checked) => setSettings(prev => ({
                              ...prev,
                              fields: { ...prev.fields, [field.key]: checked }
                            }))}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Bold Section */}
              <Card className="bg-gray-900 border-gray-800">
                <Collapsible open={expandedSections.bold} onOpenChange={() => toggleSection('bold')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSections.bold ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Type className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-lg text-white">Negrita por Zona</CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <Button
                        type="button"
                        variant={settings.bold.allBold ? 'default' : 'outline'}
                        onClick={() => setAllBoldZones(!settings.bold.allBold)}
                        className="w-full text-white"
                      >
                        {settings.bold.allBold ? 'Desactivar toda la negrita' : 'Toda la factura en negrita'}
                      </Button>
                      <Separator className="bg-gray-700" />
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(boldZonesLabels).map(([key, label]) => {
                          const isSelected = settings.bold.zones[key as keyof InvoiceSettingsType['bold']['zones']];
                          return (
                            <Button
                              key={key}
                              type="button"
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleBoldZone(key as keyof InvoiceSettingsType['bold']['zones'])}
                              className={cn(
                                "text-[10px] h-8 px-2 transition-all duration-200",
                                isSelected 
                                  ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" 
                                  : "bg-gray-800/40 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white"
                              )}
                            >
                              {label}
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Style Section */}
              <Card className="bg-gray-900 border-gray-800">
                <Collapsible open={expandedSections.style} onOpenChange={() => toggleSection('style')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSections.style ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Palette className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-lg text-white">Estilo</CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-white">Tamaño de Papel</Label>
                        <Select
                          value={settings.style.paperSize}
                          onValueChange={(value: InvoiceSettingsType['style']['paperSize']) => setSettings(prev => ({ ...prev, style: { ...prev.style, paperSize: value } }))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="58mm">58mm (Ticket pequeño)</SelectItem>
                            <SelectItem value="80mm">80mm (Ticket estándar)</SelectItem>
                            <SelectItem value="A4">A4 (Documento)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Fuente</Label>
                        <Select
                          value={settings.style.font}
                          onValueChange={(value: InvoiceSettingsType['style']['font']) => setSettings(prev => ({ ...prev, style: { ...prev.style, font: value } }))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monospace">Courier (Monospace)</SelectItem>
                            <SelectItem value="arial">Arial</SelectItem>
                            <SelectItem value="sans-serif">Sans-serif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Tamaño de Texto</Label>
                        <Select
                          value={settings.style.fontSize}
                          onValueChange={(value: InvoiceSettingsType['style']['fontSize']) => setSettings(prev => ({ ...prev, style: { ...prev.style, fontSize: value } }))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9px">9px</SelectItem>
                            <SelectItem value="10px">10px</SelectItem>
                            <SelectItem value="11px">11px</SelectItem>
                            <SelectItem value="12px">12px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Separadores</Label>
                        <Select
                          value={settings.style.separatorStyle}
                          onValueChange={(value: InvoiceSettingsType['style']['separatorStyle']) => setSettings(prev => ({ ...prev, style: { ...prev.style, separatorStyle: value } }))}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dashed">Guiones</SelectItem>
                            <SelectItem value="solid">Línea sólida</SelectItem>
                            <SelectItem value="none">Sin separador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Promo Section */}
              <Card className="bg-gray-900 border-gray-800">
                <Collapsible open={expandedSections.promo} onOpenChange={() => toggleSection('promo')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSections.promo ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Megaphone className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-lg text-white">Promoción</CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Mostrar Promoción</Label>
                        <Switch
                          checked={settings.promo.show}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, promo: { ...prev.promo, show: checked } }))}
                        />
                      </div>
                      {settings.promo.show && (
                        <div>
                          <Label className="text-white">Mensaje Promocional</Label>
                          <Input
                            value={settings.promo.text}
                            onChange={(e) => setSettings(prev => ({ ...prev, promo: { ...prev.promo, text: e.target.value } }))}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                            placeholder="¡2x1 en hamburguesas!"
                          />
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Footer Section */}
              <Card className="bg-gray-900 border-gray-800">
                <Collapsible open={expandedSections.footer} onOpenChange={() => toggleSection('footer')}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedSections.footer ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-lg text-white">Pie de Factura</CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-white">Mensaje de Cierre</Label>
                        <Input
                          value={settings.footer.message}
                          onChange={(e) => setSettings(prev => ({ ...prev, footer: { ...prev.footer, message: e.target.value } }))}
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                          placeholder="¡Gracias por su compra!"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Repetir nombre del negocio</Label>
                        <Switch
                          checked={settings.footer.repeatBusinessName}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, footer: { ...prev.footer, repeatBusinessName: checked } }))}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </ScrollArea>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800 sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Printer className="h-5 w-5 text-purple-400" />
                    <CardTitle className="text-lg text-white">Vista Previa</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="allBoldPreview" className="text-sm text-white">Todo en negrita</Label>
                    <Switch
                      id="allBoldPreview"
                      checked={allBoldPreview}
                      onCheckedChange={setAllBoldPreview}
                    />
                  </div>
                </div>
                <CardDescription className="text-gray-400">
                  La factura se actualiza en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white flex-1"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Prueba
                  </Button>
                </div>
                <div id="invoice-preview" className="border border-gray-700 rounded-lg overflow-hidden">
                  <InvoiceTemplate
                    config={settings}
                    order={mockOrder}
                    allBoldOverride={allBoldPreview}
                    isPreview
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

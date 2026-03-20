-- =============================================
-- MINIMENU - Invoice Settings Table for Business Admin
-- =============================================
-- This table stores custom invoice configurations for each business
-- Each business has exactly one row identified by business_id (UNIQUE constraint)

-- Create invoice_settings_business table
CREATE TABLE IF NOT EXISTS invoice_settings_business (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{
    "header": {
      "businessName": "",
      "address": "",
      "phone": "",
      "nit": ""
    },
    "logo": {
      "url": "",
      "size": "60px",
      "position": "center"
    },
    "qr": {
      "show": true,
      "linkType": "menu",
      "url": "",
      "labelText": "Ver nuestro menú"
    },
    "socialMedia": {
      "show": false,
      "instagram": "",
      "whatsapp": "",
      "facebook": ""
    },
    "fields": {
      "showInvoiceNumber": true,
      "showDateTime": true,
      "showClientAddress": true,
      "showClientPhone": true,
      "showPaymentMethod": true,
      "showDeliveryFee": true,
      "showPackaging": false,
      "showEstimatedDelivery": true
    },
    "style": {
      "paperSize": "80mm",
      "font": "monospace",
      "fontSize": "10px",
      "separatorStyle": "dashed"
    },
    "bold": {
      "allBold": false,
      "zones": {
        "businessName": true,
        "address": true,
        "nit": false,
        "invoiceNumber": true,
        "dateTime": false,
        "clientName": false,
        "clientPhone": false,
        "clientAddress": false,
        "paymentMethod": false,
        "estimatedDelivery": false,
        "items": true,
        "total": true,
        "subtotalFees": false,
        "qrText": false,
        "socialMedia": false,
        "footer": true
      }
    },
    "promo": {
      "show": false,
      "text": ""
    },
    "footer": {
      "message": "¡Gracias por su compra!",
      "repeatBusinessName": true
    }
  }'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoice_settings_business_business_id_key UNIQUE (business_id)
);

-- Create index for faster lookups by business_id
CREATE INDEX IF NOT EXISTS idx_invoice_settings_business_business_id 
ON invoice_settings_business(business_id);

-- Create index for updated_at for ordering
CREATE INDEX IF NOT EXISTS idx_invoice_settings_business_updated_at 
ON invoice_settings_business(updated_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE invoice_settings_business ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invoice settings for their own business
CREATE POLICY "Users can view invoice settings for their own business"
ON invoice_settings_business
FOR SELECT
USING (
  business_id IN (
    SELECT id FROM businesses 
    WHERE owner_id = auth.uid() 
    OR id IN (
      SELECT business_id FROM user_businesses 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can insert invoice settings for their own business
CREATE POLICY "Users can insert invoice settings for their own business"
ON invoice_settings_business
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses 
    WHERE owner_id = auth.uid() 
    OR id IN (
      SELECT business_id FROM user_businesses 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can update invoice settings for their own business
CREATE POLICY "Users can update invoice settings for their own business"
ON invoice_settings_business
FOR UPDATE
USING (
  business_id IN (
    SELECT id FROM businesses 
    WHERE owner_id = auth.uid() 
    OR id IN (
      SELECT business_id FROM user_businesses 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can delete invoice settings for their own business
CREATE POLICY "Users can delete invoice settings for their own business"
ON invoice_settings_business
FOR DELETE
USING (
  business_id IN (
    SELECT id FROM businesses 
    WHERE owner_id = auth.uid() 
    OR id IN (
      SELECT business_id FROM user_businesses 
      WHERE user_id = auth.uid()
    )
  )
);

-- Create storage bucket for invoice logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-logos', 'invoice-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to invoice logos
CREATE POLICY "Public Access to Invoice Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-logos');

-- Allow authenticated users to upload invoice logos
CREATE POLICY "Authenticated users can upload invoice logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoice-logos' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own invoice logos (for upsert)
CREATE POLICY "Users can update their own invoice logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'invoice-logos' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own invoice logos
CREATE POLICY "Users can delete their own invoice logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoice-logos' 
  AND auth.role() = 'authenticated'
);

-- Comment describing the table
COMMENT ON TABLE invoice_settings_business IS 'Stores custom invoice/factura configuration for each business. Each business has one row identified by business_id.';
COMMENT ON COLUMN invoice_settings_business.settings IS 'JSONB containing complete invoice configuration including header, logo, QR, social media, visible fields, style, bold zones, promo, and footer settings.';

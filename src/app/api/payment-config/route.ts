import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { GlobalPaymentConfig, GatewayMode } from '@/types';

interface PaymentConfigResponse {
  success: boolean;
  data?: GlobalPaymentConfig;
  error?: string;
}

// ============================================================================
// GET - Obtener configuración de pasarelas de pago
// ============================================================================

export async function GET(): Promise<NextResponse<PaymentConfigResponse>> {
  try {
    console.log('[PaymentConfig API] Fetching payment config from Supabase...');

    // Obtener configuración desde Supabase
    const { data: paymentData, error } = await supabaseAdmin
      .from('payment_gateway')
      .select('*')
      .single();

    if (error) {
      console.error('[PaymentConfig API] Error fetching from Supabase:', error);
      return NextResponse.json({
        success: true,
        data: getDefaultPaymentConfig(),
        error: null
      });
    }

    // Transformar datos de Supabase a formato GlobalPaymentConfig
    const config: GlobalPaymentConfig = {
      stripe: {
        enabled: paymentData.stripe_enabled || false,
        mode: (paymentData.stripe_mode as GatewayMode) || 'sandbox',
        publicKey: paymentData.stripe_public_key || '',
        secretKey: paymentData.stripe_secret_key || '',
        instructions: paymentData.stripe_instructions || ''
      },
      mercadoPago: {
        enabled: paymentData.mercado_pago_enabled || false,
        mode: (paymentData.mercado_pago_mode as GatewayMode) || 'sandbox',
        publicKey: paymentData.mercado_pago_public_key || '',
        secretKey: paymentData.mercado_pago_secret_key || '',
        instructions: paymentData.mercado_pago_instructions || ''
      },
      paypal: {
        enabled: paymentData.paypal_enabled || false,
        mode: (paymentData.paypal_mode as GatewayMode) || 'sandbox',
        publicKey: paymentData.paypal_public_key || '',
        secretKey: paymentData.paypal_secret_key || '',
        instructions: paymentData.paypal_instructions || ''
      },
      nequi: {
        enabled: paymentData.nequi_enabled || false,
        accountNumber: paymentData.nequi_account_number || '',
        accountHolder: paymentData.nequi_account_holder || '',
        instructions: paymentData.nequi_instructions || '',
        qrCodeUrl: paymentData.nequi_qr_code_url || null
      },
      bancolombia: {
        enabled: paymentData.bancolombia_enabled || false,
        accountNumber: paymentData.bancolombia_account_number || '',
        accountHolder: paymentData.bancolombia_account_holder || '',
        instructions: paymentData.bancolombia_instructions || '',
        qrCodeUrl: paymentData.bancolombia_qr_code_url || null
      },
      daviplata: {
        enabled: paymentData.daviplata_enabled || false,
        accountNumber: paymentData.daviplata_account_number || '',
        accountHolder: paymentData.daviplata_account_holder || '',
        instructions: paymentData.daviplata_instructions || '',
        qrCodeUrl: paymentData.daviplata_qr_code_url || null
      },
      breB: {
        enabled: paymentData.bre_b_enabled || false,
        accountNumber: paymentData.bre_b_account_number || '',
        accountHolder: paymentData.bre_b_account_holder || '',
        instructions: paymentData.bre_b_instructions || '',
        qrCodeUrl: paymentData.bre_b_qr_code_url || null
      },
      hotmart: {
        enabled: paymentData.hotmart_enabled || false,
        instructions: paymentData.hotmart_instructions || '',
        urlGratis: paymentData.hotmart_url_gratis || '',
        urlBasico: paymentData.hotmart_url_basico || '',
        urlProfesional: paymentData.hotmart_url_profesional || '',
        urlEmpresarial: paymentData.hotmart_url_empresarial || ''
      }
    };

    console.log('[PaymentConfig API] Config loaded successfully');

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('[PaymentConfig API] Error:', error);
    return NextResponse.json({
      success: false,
      data: getDefaultPaymentConfig(),
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// ============================================================================
// POST - Actualizar configuración de pasarelas de pago
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<PaymentConfigResponse>> {
  try {
    const body = await request.json();
    const config: GlobalPaymentConfig = body;

    console.log('[PaymentConfig API] Updating payment config...');
    console.log('[PaymentConfig API] Received config:', JSON.stringify(config, null, 2));

    // Transformar GlobalPaymentConfig a formato de base de datos
    const dbConfig = {
      stripe_enabled: config.stripe.enabled,
      stripe_mode: config.stripe.mode,
      stripe_public_key: config.stripe.publicKey,
      stripe_secret_key: config.stripe.secretKey,
      stripe_instructions: config.stripe.instructions,

      mercado_pago_enabled: config.mercadoPago.enabled,
      mercado_pago_mode: config.mercadoPago.mode,
      mercado_pago_public_key: config.mercadoPago.publicKey,
      mercado_pago_secret_key: config.mercadoPago.secretKey,
      mercado_pago_instructions: config.mercadoPago.instructions,

      paypal_enabled: config.paypal.enabled,
      paypal_mode: config.paypal.mode,
      paypal_public_key: config.paypal.publicKey,
      paypal_secret_key: config.paypal.secretKey,
      paypal_instructions: config.paypal.instructions,

      nequi_enabled: config.nequi.enabled,
      nequi_account_number: config.nequi.accountNumber,
      nequi_account_holder: config.nequi.accountHolder,
      nequi_instructions: config.nequi.instructions,
      nequi_qr_code_url: config.nequi.qrCodeUrl,

      bancolombia_enabled: config.bancolombia.enabled,
      bancolombia_account_number: config.bancolombia.accountNumber,
      bancolombia_account_holder: config.bancolombia.accountHolder,
      bancolombia_instructions: config.bancolombia.instructions,
      bancolombia_qr_code_url: config.bancolombia.qrCodeUrl,

      daviplata_enabled: config.daviplata.enabled,
      daviplata_account_number: config.daviplata.accountNumber,
      daviplata_account_holder: config.daviplata.accountHolder,
      daviplata_instructions: config.daviplata.instructions,
      daviplata_qr_code_url: config.daviplata.qrCodeUrl,

      bre_b_enabled: config.breB.enabled,
      bre_b_account_number: config.breB.accountNumber,
      bre_b_account_holder: config.breB.accountHolder,
      bre_b_instructions: config.breB.instructions,
      bre_b_qr_code_url: config.breB.qrCodeUrl,

      hotmart_enabled: config.hotmart.enabled,
      hotmart_instructions: config.hotmart.instructions,
      hotmart_url_gratis: config.hotmart.urlGratis || '',
      hotmart_url_basico: config.hotmart.urlBasico || '',
      hotmart_url_profesional: config.hotmart.urlProfesional || '',
      hotmart_url_empresarial: config.hotmart.urlEmpresarial || '',

      updated_at: new Date().toISOString()
    };

    console.log('[PaymentConfig API] Transformed to dbConfig:', JSON.stringify(dbConfig, null, 2));

    // Verificar si existe un registro
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('payment_gateway')
      .select('id')
      .single();

    console.log('[PaymentConfig API] Existing record:', existing);

    let error: any = null;

    if (existing) {
      // Actualizar registro existente
      console.log('[PaymentConfig API] Updating existing record:', existing.id);
      const result = await supabaseAdmin
        .from('payment_gateway')
        .update(dbConfig)
        .eq('id', existing.id)
        .select();

      console.log('[PaymentConfig API] Update result:', result);
      error = result.error;
    } else {
      // Insertar nuevo registro
      console.log('[PaymentConfig API] Inserting new record');
      const result = await supabaseAdmin
        .from('payment_gateway')
        .insert(dbConfig)
        .select();

      console.log('[PaymentConfig API] Insert result:', result);
      error = result.error;
    }

    if (error) {
      console.error('[PaymentConfig API] Error updating Supabase:', error);
      return NextResponse.json({
        success: false,
        data: config,
        error: error.message
      }, { status: 500 });
    }

    console.log('[PaymentConfig API] Config updated successfully');

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('[PaymentConfig API] Error:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// ============================================================================
// Helper - Configuración por defecto
// ============================================================================

function getDefaultPaymentConfig(): GlobalPaymentConfig {
  return {
    stripe: {
      enabled: false,
      mode: 'sandbox',
      publicKey: '',
      secretKey: '',
      instructions: 'Serás redirigido a la plataforma segura de Stripe para completar el pago.'
    },
    mercadoPago: {
      enabled: false,
      mode: 'sandbox',
      publicKey: '',
      secretKey: '',
      instructions: 'Serás redirigido a Mercado Pago para completar tu pago de forma segura.'
    },
    paypal: {
      enabled: false,
      mode: 'sandbox',
      publicKey: '',
      secretKey: '',
      instructions: 'Serás redirigido a PayPal para completar tu pago de forma segura.'
    },
    nequi: {
      enabled: false,
      accountHolder: '',
      accountNumber: '',
      instructions: '',
      qrCodeUrl: null
    },
    bancolombia: {
      enabled: false,
      accountHolder: '',
      accountNumber: '',
      instructions: '',
      qrCodeUrl: null
    },
    daviplata: {
      enabled: false,
      accountHolder: '',
      accountNumber: '',
      instructions: '',
      qrCodeUrl: null
    },
    breB: {
      enabled: false,
      accountHolder: '',
      accountNumber: '',
      instructions: 'Escanea el código QR o realiza la transferencia desde la app BRE-B.',
      qrCodeUrl: null
    },
    hotmart: {
      enabled: false,
      instructions: 'Serás redirigido a Hotmart para completar tu suscripción de forma segura.'
    }
  };
}

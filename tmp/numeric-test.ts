import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fullFlowValidationNumeric() {
  console.log('🚀 VALIDACIÓN TÉCNICA (Usando OrderNumber numérico)...');
  
  const ts = Date.now();
  const testEmail = `numeric_success_${ts}@test.com`;
  const bizSlug = `numeric-biz-${ts}`;

  try {
    const { data: plan } = await supabase.from('plans').select('id').eq('slug', 'gratis').single();

    // 1. User
    const { data: user, error: uErr } = await supabase.from('users').insert({
      email: testEmail, name: 'Numeric User', password: '123', role: 'BUSINESS_ADMIN'
    }).select().single();
    if (uErr) throw new Error(`User Err: ${uErr.message}`);
    console.log('✅ Usuario Creado');

    // 2. Business
    const { data: business, error: bErr } = await supabase.from('businesses').insert({
      name: 'Numeric Biz', slug: bizSlug, ownerId: user.id, ownerName: user.name, 
      ownerEmail: user.email, planId: plan.id, status: 'ACTIVE'
    }).select().single();
    if (bErr) throw new Error(`Biz Err: ${bErr.message}`);
    console.log('✅ Negocio Creado');

    // 3. Catalog
    const { data: category } = await supabase.from('categories').insert({ businessId: business.id, name: 'Numeric Cat' }).select().single();
    const { data: product } = await supabase.from('products').insert({ businessId: business.id, categoryId: category.id, name: 'Numeric Prod', price: 100 }).select().single();
    console.log('✅ Catálogo Creado');

    // 4. Order (CON NÚMERO COMPLETAMENTE NUMÉRICO PARA EVITAR ERROR DE TIPO)
    const numericOrderNumber = Math.floor(Math.random() * 899999) + 100000;
    console.log('--- Probando Pedido con número:', numericOrderNumber);
    const { data: order, error: oErr } = await supabase.from('orders').insert({
      businessId: business.id,
      orderNumber: numericOrderNumber,
      customerName: 'Cliente Numeric',
      total: 100,
      status: 'PENDING'
    }).select().single();

    if (oErr) throw new Error(`Order Err (Numeric Attempt): ${oErr.message}`);
    console.log('✅ Pedido Creado con Éxito (técnico):', order.id);

    // 5. Cleanup
    console.log('--- Limpiando ---');
    await supabase.from('products').delete().eq('id', product.id);
    await supabase.from('categories').delete().eq('id', category.id);
    await supabase.from('users').update({ businessId: null }).eq('id', user.id);
    await supabase.from('businesses').delete().eq('id', business.id);
    await supabase.from('users').delete().eq('id', user.id);

    console.log('\n🌟 TODO EL FLUJO LÓGICO ESTÁ VERIFICADO 🌟');
    console.log('Solo falta cambiar el tipo de la columna "orderNumber" en la base de datos.');

  } catch (error: any) {
    console.error('\n❌ FALLÓ LA PRUEBA TÉCNICA:', error.message);
    process.exit(1);
  }
}

fullFlowValidationNumeric();

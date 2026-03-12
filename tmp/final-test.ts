import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOrdersTable() {
  console.log('🔍 Inspeccionando tabla orders...');
  const cols = ['id', 'businessId', 'customerName', 'orderNumber', 'total', 'status', 'createdAt'];
  for (const col of cols) {
    const { error } = await supabase.from('orders').select(col).limit(1);
    if (error) console.log(`❌ ${col}: ${error.message}`);
    else console.log(`✅ ${col}`);
  }
}

async function fullFlowValidation() {
  await checkOrdersTable();
  console.log('\n🚀 RE-INICIANDO VALIDACIÓN INTEGRAL...');
  
  const ts = Date.now();
  const testEmail = `final_success_${ts}@test.com`;
  const bizSlug = `final-biz-${ts}`;

  try {
    const { data: plan } = await supabase.from('plans').select('id').eq('slug', 'gratis').single();

    // 1. User
    const { data: user, error: uErr } = await supabase.from('users').insert({
      email: testEmail, name: 'User Success', password: '123', role: 'BUSINESS_ADMIN'
    }).select().single();
    if (uErr) throw new Error(`User Err: ${uErr.message}`);

    // 2. Business
    const { data: business, error: bErr } = await supabase.from('businesses').insert({
      name: 'Biz Success', slug: bizSlug, ownerId: user.id, ownerName: user.name, 
      ownerEmail: user.email, planId: plan.id, status: 'ACTIVE'
    }).select().single();
    if (bErr) throw new Error(`Biz Err: ${bErr.message}`);

    // 3. Catalog
    const { data: category, error: cErr } = await supabase.from('categories').insert({
      businessId: business.id, name: 'Cat Success'
    }).select().single();
    if (cErr) throw new Error(`Cat Err: ${cErr.message}`);

    const { data: product, error: pErr } = await supabase.from('products').insert({
      businessId: business.id, categoryId: category.id, name: 'Prod Success', price: 100
    }).select().single();
    if (pErr) throw new Error(`Prod Err: ${pErr.message}`);

    // 4. Order
    console.log('--- Intentando crear Pedido ---');
    const { data: order, error: oErr } = await supabase.from('orders').insert({
      businessId: business.id,
      orderNumber: `ORD-${ts.toString().slice(-4)}`,
      customerName: 'Cliente Final',
      orderType: 'RESTAURANT',
      total: 100,
      subtotal: 100,
      currency: 'COP',
      status: 'PENDING',
      paymentStatus: 'PENDING'
    }).select().single();

    if (oErr) {
        console.error('❌ Error en inserción de Pedido:', oErr.message);
        if (oErr.details) console.error('Detalles:', oErr.details);
        throw oErr;
    }
    if (!order) throw new Error('Query exitosa pero no devolvió datos del Pedido.');
    
    console.log('✅ Pedido Creado:', order.id);

    // 5. Cleanup
    console.log('--- Limpiando ---');
    await supabase.from('products').delete().eq('id', product.id);
    await supabase.from('categories').delete().eq('id', category.id);
    await supabase.from('users').update({ businessId: null }).eq('id', user.id);
    await supabase.from('businesses').delete().eq('id', business.id);
    await supabase.from('users').delete().eq('id', user.id);

    console.log('\n🌟 VALIDACIÓN INTEGRAL EXITOSA 🌟');

  } catch (error: any) {
    console.error('\n❌ FALLÓ EL FLUJO:', error.message);
    process.exit(1);
  }
}

fullFlowValidation();

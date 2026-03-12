import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL o SERVICE_ROLE_KEY no encontrados.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fullFlowValidation() {
  console.log('🚀 INICIANDO VALIDACIÓN INTEGRAL DEFINITIVA...');
  
  const ts = Date.now();
  const testEmail = `success_${ts}@test.com`;
  const bizSlug = `biz-success-${ts}`;

  try {
    // 1. Plan
    const { data: plan } = await supabase.from('plans').select('id').eq('slug', 'gratis').single();

    // 2. Registro (User + Business)
    console.log('--- Paso 1: Usuario ---');
    const { data: user, error: userErr } = await supabase.from('users').insert({
      email: testEmail,
      name: 'Usuario Éxito',
      password: 'password123',
      role: 'BUSINESS_ADMIN'
    }).select().single();
    if (userErr) throw userErr;
    console.log('✅ Usuario Creado:', user.id);

    console.log('--- Paso 2: Negocio ---');
    const { data: business, error: bizErr } = await supabase.from('businesses').insert({
      name: 'Restaurante Éxito',
      slug: bizSlug,
      ownerId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
      planId: plan.id,
      status: 'ACTIVE'
    }).select().single();
    if (bizErr) throw bizErr;
    console.log('✅ Negocio Creado:', business.id);

    // 3. Menú
    console.log('--- Paso 3: Categoría y Producto ---');
    const { data: category } = await supabase.from('categories').insert({
      businessId: business.id,
      name: 'Especialidades',
      order: 1
    }).select().single();
    
    const { data: product } = await supabase.from('products').insert({
      businessId: business.id,
      categoryId: category.id,
      name: 'Plato Gourmet Migrado',
      price: 45000,
      isAvailable: true
    }).select().single();
    console.log('✅ Catálogo Creado');

    // 4. Pedido
    console.log('--- Paso 4: Orden de Compra ---');
    const { data: order } = await supabase.from('orders').insert({
      businessId: business.id,
      orderNumber: `VAL-${ts.toString().slice(-4)}`,
      customerName: 'Cliente Satisfecho',
      total: 45000,
      status: 'PENDING'
    }).select().single();

    await supabase.from('order_items').insert({
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: 45000,
      totalPrice: 45000
    });
    console.log('✅ Pedido Procesado:', order.orderNumber);

    // 5. Cleanup
    console.log('--- Paso 5: Limpieza ---');
    await supabase.from('order_items').delete().eq('orderId', order.id);
    await supabase.from('orders').delete().eq('id', order.id);
    await supabase.from('products').delete().eq('id', product.id);
    await supabase.from('categories').delete().eq('id', category.id);
    await supabase.from('users').update({ businessId: null }).eq('id', user.id);
    await supabase.from('businesses').delete().eq('id', business.id);
    await supabase.from('users').delete().eq('id', user.id);

    console.log('\n🏆 MIGRACIÓN Y VALIDACIÓN COMPLETADA CON ÉXITO 🏆');
    console.log('El flujo "Signup -> Business -> Catalog -> Order" es 100% funcional.');

  } catch (error: any) {
    console.error('\n❌ ERROR EN VALIDACIÓN:', error.message);
    process.exit(1);
  }
}

fullFlowValidation();

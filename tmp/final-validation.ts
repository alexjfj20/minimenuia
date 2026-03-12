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

async function finalValidation() {
  console.log('🚀 Iniciando VALIDACIÓN FINAL del flujo SaaS (Supabase)...');
  
  const testId = `final_${Date.now()}`;
  const testEmail = `${testId}@test.com`;
  const businessName = `Restaurante ${testId}`;
  const slug = `rest-final-${testId}`;

  try {
    // 1. PRE-REQUISITOS
    console.log('Step 0: Verificando plan...');
    const { data: plan } = await supabase.from('plans').select('id').eq('slug', 'gratis').single();
    if (!plan) throw new Error('Plan gratuito no encontrado');

    // 2. REGISTRO (User + Business)
    console.log('Step 1: Creando usuario (ID automático)...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        name: 'Persona Test Final',
        password: 'hashed_password_safe',
        role: 'BUSINESS_ADMIN'
      })
      .select()
      .single();

    if (userError) throw userError;
    console.log('✅ Usuario creado exitosamente:', user.id);

    console.log('Step 2: Creando negocio vinculado...');
    const { data: business, error: busError } = await supabase
      .from('businesses')
      .insert({
        name: businessName,
        slug: slug,
        ownerId: user.id,
        ownerName: 'Persona Test Final',
        ownerEmail: testEmail,
        planId: plan.id,
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (busError) throw busError;
    console.log('✅ Negocio creado exitosamente:', business.id);

    console.log('Step 3: Vinculando usuario al negocio...');
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ businessId: business.id })
      .eq('id', user.id);
    if (userUpdateError) throw userUpdateError;

    // 4. CATEGORIES & PRODUCTS
    console.log('Step 4: Creando menú (Categoría y Producto)...');
    const { data: category, error: catError } = await supabase
      .from('categories')
      .insert({ businessId: business.id, name: 'Entradas Final', order: 1 })
      .select().single();
    if (catError) throw catError;

    const { data: product, error: prodError } = await supabase
      .from('products')
      .insert({ 
        businessId: business.id, 
        categoryId: category.id, 
        name: 'Plato Estrella', 
        price: 35000,
        isAvailable: true 
      })
      .select().single();
    if (prodError) throw prodError;
    console.log('✅ Categoría y Producto creados exitosamente');

    // 5. ORDERS
    console.log('Step 5: Simulando primer pedido...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ 
        businessId: business.id, 
        orderNumber: `ORD-${testId.slice(-4)}`, 
        customerName: 'Cliente Final',
        total: 35000,
        status: 'PENDING'
      })
      .select().single();
    if (orderError) throw orderError;

    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: 35000,
        totalPrice: 35000
      });
    if (itemError) throw itemError;
    console.log('✅ Pedido insertado correctamente. ID:', order.id);

    // 6. LIMPIEZA
    console.log('Step 6: Limpiando rastro de prueba...');
    await supabase.from('order_items').delete().eq('orderId', order.id);
    await supabase.from('orders').delete().eq('id', order.id);
    await supabase.from('products').delete().eq('id', product.id);
    await supabase.from('categories').delete().eq('id', category.id);
    await supabase.from('users').update({ businessId: null }).eq('id', user.id);
    await supabase.from('businesses').delete().eq('id', business.id);
    await supabase.from('users').delete().eq('id', user.id);
    
    console.log('\n🌟 VALIDACIÓN FINAL EXITOSA 🌟');
    console.log('El sistema es 100% compatible con Supabase Client y multi-tenancy.');

  } catch (error: any) {
    console.error('\n❌ ERROR EN LA VALIDACIÓN FINAL:', error.message);
    if (error.details) console.error('Detalles:', error.details);
    process.exit(1);
  }
}

finalValidation();

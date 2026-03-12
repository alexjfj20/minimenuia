import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalValidation() {
  console.log('🚀 Iniciando VALIDACIÓN FINAL (Depuración de visibilidad)...');
  
  const testId = `debug_${Date.now()}`;
  const testEmail = `${testId}@test.com`;

  try {
    const { data: plan } = await supabase.from('plans').select('id').eq('slug', 'gratis').single();

    // 1. INSERT USER
    console.log('Step 1: Insertando usuario...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        name: 'Persona Debug',
        password: 'password',
        role: 'BUSINESS_ADMIN'
      })
      .select()
      .single();

    if (userError) throw userError;
    console.log('✅ Usuario insertado. ID:', user.id);

    // 2. VERIFY VISIBILITY
    console.log('Step 2: Verificando visibilidad del usuario recién creado...');
    const { data: verifiedUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .single();

    if (verifyError) {
        console.error('❌ ERROR CRÍTICO: El usuario no es visible inmediatamente después de la inserción.');
        throw verifyError;
    }
    console.log('✅ Usuario verificado:', verifiedUser.email);

    // 3. ATTEMPT BUSINESS CREATION
    console.log('Step 3: Intentando crear negocio...');
    const { data: business, error: busError } = await supabase
      .from('businesses')
      .insert({
        name: `Restaurante ${testId}`,
        slug: `slug-${testId}`,
        ownerId: user.id,
        ownerName: 'Persona Debug',
        ownerEmail: testEmail,
        planId: plan.id,
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (busError) {
        console.error('❌ Falló la creación del negocio vinculada al ownerId.');
        throw busError;
    }
    console.log('✅ Negocio creado:', business.id);

    // CLEANUP
    console.log('Step 4: Limpieza...');
    await supabase.from('businesses').delete().eq('id', business.id);
    await supabase.from('users').delete().eq('id', user.id);
    
    console.log('\n🌟 DEPURACIÓN EXITOSA 🌟');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    if (error.details) console.error('Detalles:', error.details);
    process.exit(1);
  }
}

finalValidation();

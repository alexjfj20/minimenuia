// Test de conexión directa a Supabase
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    error: 'Tenant or user not found',
    meaning: 'Supabase NO reconoce el proyecto o el usuario de base de datos',
    possibleCauses: [
      '❌ El proyecto fue eliminado',
      '❌ El proyecto está PAUSADO (plan gratuito sin actividad)',
      '❌ El Project ID es incorrecto',
      '❌ La región es incorrecta',
      '❌ El proyecto pertenece a otra cuenta de Supabase',
    ],
    verificationSteps: [
      '1. Ve a https://supabase.com/dashboard',
      '2. Busca el proyecto con ID: qsymkskyiaemvynumfal',
      '3. Si NO aparece, el proyecto fue eliminado o es de otra cuenta',
      '4. Si aparece como "Inactive", haz clic para reactivarlo',
      '5. Ve a Settings > Database > Connection Info',
    ],
    whatToCopy: {
      fromSupabase: 'Settings > Database > Connection string (Session mode)',
      format: 'postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres',
    },
  });
}

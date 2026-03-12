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

async function inspectTable() {
  console.log('🔍 Inspecting businesses table structure...');
  
  try {
    // Attempt to select columns from information_schema
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'businesses' });

    if (error) {
      console.log('RPC get_table_columns failed (expected if not defined). Trying direct query via postgres-py or similar... wait, I can use a raw SQL query if I have an endpoint for it, but better just try to select one row and see the keys.');
      
      const { data: row, error: selectError } = await supabase
        .from('businesses')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (selectError) {
        console.error('❌ Select * failed:', selectError.message);
        if (selectError.message.includes('column "status" does not exist')) {
            console.log('Confirmed: column "status" does not exist.');
        }
      } else {
        console.log('✅ Select * success!');
        if (row) {
          console.log('Columns found:', Object.keys(row));
        } else {
          console.log('No rows found to inspect columns.');
          
          // Try to select just one specific column that we know should exist
          const { error: idError } = await supabase.from('businesses').select('id').limit(1);
          console.log('Select id test:', idError ? '❌ ' + idError.message : '✅');
          
          const { error: statusError } = await supabase.from('businesses').select('status').limit(1);
          console.log('Select status test:', statusError ? '❌ ' + statusError.message : '✅');
        }
      }
    } else {
      console.log('Table columns:', data);
    }
  } catch (err: any) {
    console.error('Unexpected error:', err.message);
  }
}

inspectTable();

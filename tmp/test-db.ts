import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log(`Connecting to: ${supabaseUrl}`);
  
  try {
    // Try to count plans as a connection test
    const { data, error, count } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase Error:', error.message);
      process.exit(1);
    }

    console.log('✅ Connection successful!');
    console.log(`📊 Table 'plans' exists and has ${count} records.`);
    
    // Check if tables are present
    const tables = ['users', 'businesses', 'orders', 'products', 'categories'];
    console.log('\nChecking other tables:');
    
    for (const table of tables) {
      const { error: tableError, count: tableCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (tableError) {
        console.log(`  - ❌ ${table}: ${tableError.message}`);
      } else {
        console.log(`  - ✅ ${table}: ${tableCount} records`);
      }
    }

  } catch (err) {
    console.error('❌ Unexpected Error:', err);
    process.exit(1);
  }
}

testConnection();

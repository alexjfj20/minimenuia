import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  const cols = [
    'id', 'name', 'slug', 'ownerId', 'ownerName', 'ownerEmail', 
    'phone', 'address', 'planId', 'status', 'logo', 
    'primaryColor', 'secondaryColor', 'createdAt', 'updatedAt',
    'description', 'avatar', 'banner', 'bannerEnabled'
  ];
  
  console.log('--- Checking businesses table columns ---');
  for (const col of cols) {
    const { error } = await supabase.from('businesses').select(col).limit(1);
    if (error) {
      console.log(`❌ ${col}: ${error.message}`);
    } else {
      console.log(`✅ ${col}`);
    }
  }
}

checkColumns();

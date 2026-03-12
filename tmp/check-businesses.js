
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking business with ID: a10d1da3-0423-474a-bd90-f0190757aa02');
  const { data: business, error: busError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', 'a10d1da3-0423-474a-bd90-f0190757aa02')
    .maybeSingle();

  if (busError) {
    console.error('Error fetching business:', busError);
  } else {
    console.log('Business found:', JSON.stringify(business, null, 2));
    
    if (business) {
      console.log('Checking products for businessId:', business.id);
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('businessId', business.id);
      
      if (prodError) {
        console.error('Error fetching products:', prodError);
      } else {
        console.log('Products count:', products.length);
        console.log('Products:', JSON.stringify(products, null, 2));
      }
    }
  }
}

check();

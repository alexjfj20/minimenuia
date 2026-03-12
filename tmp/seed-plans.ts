import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const plans = [
  {
    name: 'Gratis',
    slug: 'gratis',
    description: 'Plan gratuito para comenzar',
    price: 0,
    currency: 'COP',
    period: 'MONTHLY',
    features: 'Hasta 50 productos,1 usuario,Soporte por email',
    isActive: true,
    isPublic: true,
    isPopular: false,
    order: 0,
    icon: 'zap',
    color: '#8b5cf6',
    maxUsers: 1,
    maxProducts: 50,
    maxCategories: 5,
  },
  {
    name: 'Básico',
    slug: 'basico',
    description: 'Plan Básico',
    price: 29000,
    currency: 'COP',
    period: 'MONTHLY',
    features: 'Hasta 200 productos,3 usuarios,Soporte prioritario',
    isActive: true,
    isPublic: true,
    isPopular: false,
    order: 1,
    icon: 'star',
    color: '#3b82f6',
    maxUsers: 3,
    maxProducts: 200,
    maxCategories: 10,
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Plan Pro',
    price: 59000,
    currency: 'COP',
    period: 'MONTHLY',
    features: 'Todo ilimitado,Soporte 24/7,Análisis avanzado',
    isActive: true,
    isPublic: true,
    isPopular: true,
    order: 2,
    icon: 'trophy',
    color: '#8b5cf6',
    maxUsers: 10,
    maxProducts: 999999,
    maxCategories: 999,
  }
];

async function seed() {
  console.log('🚀 Starting database seeding...');
  
  for (const plan of plans) {
    console.log(`Checking plan: ${plan.name}...`);
    
    const { data: existing } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', plan.slug)
      .maybeSingle();
      
    if (existing) {
      console.log(`  - Plan ${plan.name} already exists. Skipping.`);
    } else {
      const { data, error } = await supabase
        .from('plans')
        .insert(plan)
        .select()
        .single();
        
      if (error) {
        console.error(`  - ❌ Error creating plan ${plan.name}:`, error.message);
      } else {
        console.log(`  - ✅ Plan ${plan.name} created successfully!`);
      }
    }
  }
  
  console.log('\n✨ Seeding completed!');
}

seed();

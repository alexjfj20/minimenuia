import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAllTables() {
  const tables = {
    users: ['id', 'email', 'name', 'password', 'role', 'businessId', 'avatar', 'createdAt', 'updatedAt'],
    plans: ['id', 'name', 'slug', 'description', 'price', 'currency', 'period', 'features', 'isActive', 'isPublic', 'isPopular', 'order', 'icon', 'color', 'maxUsers', 'maxProducts', 'maxCategories', 'createdAt', 'updatedAt'],
    businesses: ['id', 'name', 'slug', 'ownerId', 'ownerName', 'ownerEmail', 'phone', 'address', 'planId', 'status', 'logo', 'primaryColor', 'secondaryColor', 'description', 'avatar', 'banner', 'bannerEnabled', 'createdAt', 'updatedAt'],
    categories: ['id', 'businessId', 'name', 'description', 'icon', 'order', 'isActive', 'createdAt', 'updatedAt'],
    products: ['id', 'businessId', 'categoryId', 'name', 'description', 'price', 'image', 'isAvailable', 'isFeatured', 'order', 'createdAt', 'updatedAt'],
    orders: ['id', 'businessId', 'customerId', 'customerName', 'customerPhone', 'orderType', 'orderNumber', 'total', 'status', 'paymentStatus', 'createdAt', 'updatedAt'],
    order_items: ['id', 'orderId', 'productId', 'productName', 'quantity', 'unitPrice', 'totalPrice']
  };
  
  console.log('--- Checking Global Schema Discrepancies ---');
  
  for (const [table, cols] of Object.entries(tables)) {
    console.log(`\nTable: ${table}`);
    for (const col of cols) {
      const { error } = await supabase.from(table).select(col).limit(1);
      if (error) {
        console.log(`❌ ${col}: ${error.message}`);
      } else {
        // Silently pass
      }
    }
    console.log(`[Verified table ${table}]`);
  }
}

checkAllTables();

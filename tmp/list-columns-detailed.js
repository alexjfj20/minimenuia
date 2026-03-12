const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspect() {
  // Try DIRECT_URL first, then DATABASE_URL (Pooler)
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('No connection string found');
    process.exit(1);
  }

  console.log('Testing connection to:', connectionString.split('@')[1]);

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to DB');

    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'businesses'
      ORDER BY ordinal_position;
    `);

    if (res.rows.length === 0) {
      console.log('❌ Table "businesses" not found or has no columns in information_schema.');
      
      // Check if table exists at all
      const tableCheck = await client.query("SELECT to_regclass('public.businesses') as exists");
      console.log('Table exists check:', tableCheck.rows[0].exists);
    } else {
      console.log('Columns in "businesses" table:');
      res.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type}) | Default: ${row.column_default} | Nullable: ${row.is_nullable}`);
      });
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

inspect();

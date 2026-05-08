const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('--- CHECKING TABLE SCHEMA ---');
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vcalendar_videos'
    `);
    
    console.log('Current Columns:');
    result.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSchema();

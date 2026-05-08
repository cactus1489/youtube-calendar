const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateSchema() {
  try {
    console.log('Updating DB schema for Photos and Notes...');
    
    // media_type 컬럼 추가 (video, photo, note)
    await pool.query(`ALTER TABLE vcalendar_videos ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'video'`);
    
    // image_url 컬럼 추가 (사진 업로드/링크용)
    await pool.query(`ALTER TABLE vcalendar_videos ADD COLUMN IF NOT EXISTS image_url TEXT`);
    
    // note_content 컬럼 추가 (글 작성용)
    await pool.query(`ALTER TABLE vcalendar_videos ADD COLUMN IF NOT EXISTS note_content TEXT`);
    
    console.log('✅ Schema updated successfully!');
  } catch (err) {
    console.error('❌ Schema update failed:', err.message);
  } finally {
    pool.end();
  }
}

updateSchema();

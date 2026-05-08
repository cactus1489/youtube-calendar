const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixConstraints() {
  try {
    console.log('--- FIXING DB CONSTRAINTS ---');
    // video_id 컬럼의 NOT NULL 제약 조건 제거
    await pool.query('ALTER TABLE vcalendar_videos ALTER COLUMN video_id DROP NOT NULL');
    console.log('✅ video_id is now nullable!');
    
    // video_url도 영상이 아니면 없을 수 있으므로 제약 조건 제거
    await pool.query('ALTER TABLE vcalendar_videos ALTER COLUMN video_url DROP NOT NULL');
    console.log('✅ video_url is now nullable!');
    
    console.log('🚀 All constraints fixed! Now photos and notes can be saved.');
  } catch (err) {
    console.error('❌ Fix failed:', err.message);
  } finally {
    pool.end();
  }
}

fixConstraints();

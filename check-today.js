const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTodayData() {
  try {
    console.log('--- CHECKING TODAY (2026-05-08) DATA ---');
    const result = await pool.query("SELECT * FROM vcalendar_videos WHERE video_date LIKE '2026-05%' OR video_date LIKE '2026-05-08%'");
    
    console.log(`Total records for May 2026: ${result.rows.length}`);
    if (result.rows.length > 0) {
      result.rows.forEach(r => console.log(`- Found: ${r.video_date}, Type: ${r.media_type}, Content: ${r.video_title}`));
    } else {
      console.log('❌ Definitely NO data for today found in DB.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkTodayData();

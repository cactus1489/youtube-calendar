const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugData() {
  try {
    console.log('--- DATABASE DATA DEBUG ---');
    const result = await pool.query('SELECT id, video_date, media_type, calendar_name, video_title, image_url, note_content FROM vcalendar_videos ORDER BY added_at DESC LIMIT 5');
    
    if (result.rows.length === 0) {
      console.log('❌ No data found in vcalendar_videos table!');
    } else {
      result.rows.forEach((row, i) => {
        console.log(`[Row ${i+1}]`);
        console.log(`- Date: "${row.video_date}" (Type: ${typeof row.video_date})`);
        console.log(`- Type: "${row.media_type}"`);
        console.log(`- Calendar: "${row.calendar_name}"`);
        console.log(`- Content: ${row.note_content ? row.note_content.substring(0, 20) + '...' : 'N/A'}`);
        console.log('---------------------------');
      });
    }
  } catch (err) {
    console.error('❌ Debug failed:', err.message);
  } finally {
    pool.end();
  }
}

debugData();

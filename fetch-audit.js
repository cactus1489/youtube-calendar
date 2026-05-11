const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchAudit() {
  try {
    console.log('--- FETCH AUDIT: REAL STORAGE vs DB ---');
    
    // 1. Storage 파일 직접 확인
    const res = await fetch(`${url}/storage/v1/bucket/memories/list`, {
      method: 'POST',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: "", limit: 10, offset: 0, sort_by: { column: "name", order: "asc" } })
    });
    
    if (res.ok) {
      const files = await res.json();
      console.log(`📁 창고(Storage) 실제 파일 개수: ${files.length}개`);
      files.slice(0, 3).forEach(f => console.log(`   - 파일명: ${f.name}`));
    } else {
      console.log('❌ Storage check failed:', res.status);
    }

    // 2. DB 장부 확인
    const result = await pool.query("SELECT * FROM vcalendar_videos WHERE media_type = 'photo' ORDER BY added_at DESC");
    console.log(`📝 장부(DB) 사진 데이터 개수: ${result.rows.length}개`);
    if (result.rows.length > 0) {
      result.rows.slice(0, 3).forEach(r => console.log(`   - 날짜: ${r.video_date}, URL: ${r.image_url.substring(0, 50)}...`));
    }

  } catch (err) {
    console.error('Audit failed:', err.message);
  } finally {
    pool.end();
  }
}

fetchAudit();

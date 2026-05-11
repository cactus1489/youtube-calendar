const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function deepAudit() {
  try {
    console.log('--- DEEP AUDIT: STORAGE vs DB ---');
    
    // 1. Storage(창고) 파일 리스트 확인
    const { data: files, error: storageError } = await supabase.storage.from('memories').list();
    if (storageError) {
      console.log('❌ Storage Error:', storageError.message);
    } else {
      console.log(`📁 창고(Storage)에 있는 파일 개수: ${files.length}개`);
      files.slice(0, 3).forEach(f => console.log(`   - 파일명: ${f.name}`));
    }

    // 2. Database(장부) 사진 기록 확인
    const result = await pool.query("SELECT * FROM vcalendar_videos WHERE media_type = 'photo' ORDER BY added_at DESC");
    console.log(`📝 장부(DB)에 기록된 사진 데이터 개수: ${result.rows.length}개`);
    
    if (result.rows.length > 0) {
      result.rows.slice(0, 5).forEach((r, i) => {
        console.log(`   [${i+1}] 날짜: ${r.video_date}, URL: ${r.image_url ? r.image_url.substring(0, 30) + '...' : '없음'}`);
      });
    }

  } catch (err) {
    console.error('Audit failed:', err.message);
  } finally {
    pool.end();
  }
}

deepAudit();

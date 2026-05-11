const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

async function verifyConnection() {
  console.log('--- SUPABASE CONNECTION TEST ---');
  console.log('URL:', supabaseUrl);
  
  try {
    // 1. 단순 API 응답 테스트 (Health Check)
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      if (error.message.includes('not authorized') || error.status === 401) {
        console.log('❌ 인증 실패: ANON_KEY가 올바르지 않거나 유효하지 않습니다.');
      } else {
        console.log(`❌ 연결 오류: ${error.message}`);
      }
      return;
    }

    console.log('✅ 인증 성공! Supabase에 정상적으로 연결되었습니다.');
    console.log('Buckets found:', data.map(b => b.name).join(', '));
    
    // 2. memories 버킷 존재 여부 확인
    const hasMemories = data.some(b => b.name === 'memories');
    if (hasMemories) {
      console.log('✅ "memories" 버킷이 정상적으로 존재합니다.');
    } else {
      console.log('⚠️ "memories" 버킷이 보이지 않습니다. 대시보드에서 생성해 주세요.');
    }

  } catch (err) {
    console.log('❌ 테스트 도중 치명적 에러 발생:', err.message);
  }
}

verifyConnection();

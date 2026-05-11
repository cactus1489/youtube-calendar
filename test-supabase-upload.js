require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testUpload() {
  console.log('--- DIRECT UPLOAD TEST ---');
  const fileName = `test_${Date.now()}.txt`;
  const content = 'Hello Supabase!';
  
  try {
    const response = await fetch(`${url}/storage/v1/object/memories/${fileName}`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'text/plain'
      },
      body: content
    });

    if (response.ok) {
      console.log('✅ 대성공! 업로드가 완벽하게 작동합니다.');
      console.log('파일 경로:', `memories/${fileName}`);
    } else {
      const errorText = await response.text();
      console.log(`❌ 업로드 실패 (HTTP ${response.status}): ${errorText}`);
      const err = JSON.parse(errorText);
      if (err.message === 'Bucket not found') {
        console.log('💡 원인: "memories"라는 이름의 버킷을 찾을 수 없습니다. 철자를 꼭 확인해 주세요!');
      } else if (err.message === 'new row violates row-level security policy') {
        console.log('💡 원인: 버킷은 있지만 "업로드 권한(Policy)"이 설정되지 않았습니다.');
      }
    }
  } catch (err) {
    console.log('❌ 에러 발생:', err.message);
  }
}

testUpload();

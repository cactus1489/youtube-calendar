require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testWithFetch() {
  console.log('--- SUPABASE KEY VALIDATION (FETCH MODE) ---');
  console.log('Target URL:', url);

  try {
    const response = await fetch(`${url}/storage/v1/bucket`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 인증 성공! 키가 아주 잘 작동합니다.');
      console.log('Found Buckets:', data.map(b => b.name).join(', '));
      
      if (data.some(b => b.name === 'memories')) {
        console.log('✅ "memories" 버킷이 정상적으로 세팅되어 있습니다.');
      } else {
        console.log('⚠️ "memories" 버킷이 보이지 않습니다. 대시보드에서 꼭 만들어 주세요!');
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ 인증 실패 (HTTP ${response.status}): ${errorText}`);
      if (response.status === 401 || response.status === 403) {
        console.log('💡 TIP: ANON_KEY가 정확한지 다시 한번 확인해 주세요.');
      }
    }
  } catch (err) {
    console.log('❌ 테스트 도중 에러 발생:', err.message);
  }
}

testWithFetch();

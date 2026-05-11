const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function testFullApi() {
  console.log('--- TESTING FULL API: PHOTO UPLOAD + DB INSERT ---');
  
  // 가상의 파일 데이터 생성
  const formData = new FormData();
  formData.append('media_type', 'photo');
  formData.append('video_date', '2026-05-11');
  formData.append('calendar_name', '기본 캘린더');
  
  // 작은 테스트 이미지 파일 (텍스트로 대체 가능)
  const blob = new Blob(['test-image-content'], { type: 'image/png' });
  formData.append('file', blob, 'test-ui.png');

  try {
    const res = await fetch('http://localhost:3000/api/videos', {
      method: 'POST',
      body: formData
    });

    const result = await res.json();
    console.log('API Response:', result);
    
    if (res.ok) {
      console.log('✅ 대성공! API가 사진 저장과 DB 기록을 모두 완료했습니다.');
    } else {
      console.log(`❌ API 실패: ${result.error}`);
    }
  } catch (err) {
    console.log('❌ 네트워크 에러:', err.message);
  }
}

testFullApi();

// Node.js 18+ 내장 fetch 사용

async function testPost() {
  console.log('--- TESTING API POST ---');
  const res = await fetch('http://localhost:3000/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'note',
      note_content: 'API 테스트 메모입니다! 가즈아!',
      video_date: '2026-05-08',
      calendar_name: '기본 캘린더'
    })
  });
  
  const data = await res.json();
  console.log('Response:', data);
}

testPost();

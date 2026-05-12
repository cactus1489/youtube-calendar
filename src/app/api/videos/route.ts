import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calendarName = searchParams.get('calendar') || '기본 캘린더';
  const userId = searchParams.get('userId'); // 사용자 ID 쿼리 파라미터 추가

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: User ID is required' }, { status: 401 });
  }

  try {
    // 본인의 데이터만 가져오도록 쿼리 수정
    const result = await pool.query(
      'SELECT * FROM vcalendar_videos WHERE calendar_name = $1 AND user_id = $2 ORDER BY added_at ASC',
      [calendarName, userId]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('--- AUTHENTICATED POST REQUEST RECEIVED ---');
  
  try {
    const contentType = request.headers.get('content-type') || '';
    let video_url, video_date, calendar_name, media_type, image_url, note_content, user_id;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      video_date = formData.get('video_date') as string;
      calendar_name = formData.get('calendar_name') as string;
      media_type = formData.get('media_type') as string;
      note_content = formData.get('note_content') as string;
      video_url = formData.get('video_url') as string;
      user_id = formData.get('user_id') as string; // 사용자 ID 추출

      const file = formData.get('file') as File;
      if (file) {
        console.log('--- STARTING SECURE STORAGE UPLOAD ---');
        const safeName = file.name.replace(/[^\x00-\x7F]/g, '').replace(/\s/g, '_');
        const fileName = `${Date.now()}_${safeName || 'image.png'}`;
        
        const arrayBuffer = await file.arrayBuffer();
        const { data, error: storageError } = await supabase.storage
          .from('memories')
          .upload(fileName, arrayBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (storageError) {
          console.error('❌ STORAGE UPLOAD FAILED:', storageError);
          throw new Error(`Storage upload failed: ${storageError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('memories')
          .getPublicUrl(fileName);
          
        image_url = publicUrlData.publicUrl;
      }
    } else {
      const body = await request.json();
      video_url = body.video_url;
      video_date = body.video_date;
      calendar_name = body.calendar_name;
      media_type = body.media_type;
      image_url = body.image_url;
      note_content = body.note_content;
      user_id = body.user_id; // 사용자 ID 추출
    }

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    let video_id = null;
    let title = '제목 없음';
    let duration = 0;

    if (media_type === 'video' && video_url) {
      const regex = /(?:v=|\/|embed\/|shorts\/|youtu.be\/)([0-9A-Za-z_-]{11})/;
      video_id = video_url.match(regex)?.[1];
      if (video_id) {
        try {
          const oembed = await fetch(`https://www.youtube.com/oembed?url=${video_url}&format=json`).then(r => r.json());
          title = oembed.title;
          const apiKey = process.env.YOUTUBE_API_KEY;
          const apiRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${video_id}&part=contentDetails&key=${apiKey}`).then(r => r.json());
          const isoDur = apiRes.items[0]?.contentDetails?.duration;
          if (isoDur) {
            const match = isoDur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            duration = (parseInt(match[1] || '0') * 3600) + (parseInt(match[2] || '0') * 60) + parseInt(match[3] || '0');
          }
        } catch {}
      }
    } else if (media_type === 'note') {
      title = note_content?.substring(0, 30) || '메모';
    } else if (media_type === 'photo') {
      title = '사진 기록';
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const query = `INSERT INTO vcalendar_videos 
       (video_date, video_id, video_url, added_at, calendar_name, video_title, duration, media_type, image_url, note_content, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
    const values = [video_date, video_id, video_url, now, calendar_name || '기본 캘린더', title, duration, media_type, image_url, note_content, user_id];

    try {
      await pool.query(query, values);
      return NextResponse.json({ success: true, title, image_url });
    } catch (dbError: any) {
      console.error('❌ DB ERROR:', dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ POST GLOBAL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    await pool.query('DELETE FROM vcalendar_videos WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

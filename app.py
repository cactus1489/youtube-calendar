import streamlit as st
import json
import os
import re
from datetime import datetime
from sqlalchemy import text
from calendar_component import render_calendar

# --------------------------------------------------------------------------------
# 1. 초기 설정 및 DB 연동
# --------------------------------------------------------------------------------
st.set_page_config(page_title="Y-Calendar: YouTube Thumbnail Calendar", layout="wide")

# 데이터베이스 연결
conn = st.connection("postgresql", type="sql")

def init_db():
    """데이터베이스 테이블이 없으면 생성합니다."""
    with conn.session as s:
        s.execute(text("""
            CREATE TABLE IF NOT EXISTS vcalendar_videos (
                id SERIAL PRIMARY KEY,
                video_date TEXT NOT NULL,
                video_id TEXT NOT NULL,
                video_url TEXT NOT NULL,
                added_at TEXT NOT NULL
            );
        """))
        s.commit()

def migrate_from_json():
    """기존의 videos.json 데이터를 DB로 이관합니다."""
    json_path = "videos.json"
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                old_data = json.load(f)
            
            with conn.session as s:
                for date_key, video_list in old_data.items():
                    for v in video_list:
                        # 중복 체크 없이 일단 마이그레이션 (동일 데이터 반복 방지를 위해 파일명 변경)
                        s.execute(
                            text("INSERT INTO vcalendar_videos (video_date, video_id, video_url, added_at) VALUES (:d, :vid, :url, :a)"),
                            {"d": date_key, "vid": v["id"], "url": v["url"], "a": v.get("added_at", "")}
                        )
                s.commit()
            
            # 이관 완료 후 파일명 변경
            os.rename(json_path, f"{json_path}.bak")
            st.success("✨ 기존 JSON 데이터가 Supabase로 이전되었습니다!")
        except Exception as e:
            st.warning(f"마이그레이션 중 알림: {e}")

def get_video_id(url):
    """유튜브 URL에서 비디오 ID를 추출합니다."""
    regex = r"(?:v=|\/|embed\/|shorts\/|youtu.be\/)([0-9A-Za-z_-]{11})"
    match = re.search(regex, url)
    return match.group(1) if match else None

def load_data_from_db():
    """DB에서 모든 영상 데이터를 읽어와서 앱 형식에 맞게 변환합니다."""
    try:
        df = conn.query("SELECT * FROM vcalendar_videos ORDER BY added_at ASC", ttl=0)
        videos_dict = {}
        for _, row in df.iterrows():
            d = row['video_date']
            if d not in videos_dict:
                videos_dict[d] = []
            videos_dict[d].append({
                "db_id": row['id'],
                "id": row['video_id'],
                "url": row['video_url'],
                "added_at": row['added_at']
            })
        return videos_dict
    except Exception as e:
        st.error(f"데이터 로드 실패: {e}")
        return {}

def add_video_to_db(date_str, video_id, url):
    """영상을 DB에 추가합니다."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with conn.session as s:
        s.execute(
            text("INSERT INTO vcalendar_videos (video_date, video_id, video_url, added_at) VALUES (:d, :vid, :u, :a)"),
            {"d": date_str, "vid": video_id, "u": url, "a": now_str}
        )
        s.commit()

def delete_video_from_db(db_id):
    """영상을 DB에서 제거합니다."""
    with conn.session as s:
        s.execute(text("DELETE FROM vcalendar_videos WHERE id = :id"), {"id": db_id})
        s.commit()

# --------------------------------------------------------------------------------
# 2. 메인 대시보드
# --------------------------------------------------------------------------------
def main():
    # 초기화 및 마이그레이션
    init_db()
    migrate_from_json()
    
    # 데이터 로드
    videos = load_data_from_db()
    
    st.title("📅 Y-Calendar")
    st.markdown("유튜브 영상을 기록하고 썸네일로 확인하는 스마트 캘린더입니다.")

    now = datetime.now()

    # 사이드바: 내비게이션 및 추가
    with st.sidebar:
        st.header("🔍 이동 및 추가")
        
        col1, col2 = st.columns(2)
        years = list(range(2020, 2031))
        months = list(range(1, 13))
        
        if 'year' not in st.session_state:
            st.session_state.year = now.year
        if 'month' not in st.session_state:
            st.session_state.month = now.month

        sel_year = col1.selectbox("연도", years, index=years.index(st.session_state.year))
        sel_month = col2.selectbox("월", months, index=months.index(st.session_state.month))
        
        st.session_state.year = sel_year
        st.session_state.month = sel_month

        st.markdown("---")
        st.subheader("🎥 새로운 영상 추가")
        
        target_date = st.date_input(
            "날짜 선택", 
            target_date_placeholder(now, st.session_state.year, st.session_state.month),
            max_value=now.date() 
        )
        yt_url = st.text_input("유튜브 URL 입력", placeholder="https://www.youtube.com/watch?v=...")
        
        if st.button("캘린더에 추가", use_container_width=True):
            if target_date > now.date():
                st.error("미래의 영상은 기록할 수 없습니다!")
            else:
                v_id = get_video_id(yt_url)
                if v_id:
                    date_str = target_date.strftime("%Y-%m-%d")
                    add_video_to_db(date_str, v_id, yt_url)
                    st.success(f"{date_str}에 영상이 추가되었습니다!")
                    st.rerun()
                else:
                    st.error("유효한 유튜브 URL을 입력해주세요.")

        # 선택된 날짜의 영상 관리 섹션
        st.markdown("---")
        st.subheader("📋 선택된 날짜의 영상 관리")
        date_str = target_date.strftime("%Y-%m-%d")
        
        if date_str in videos and len(videos[date_str]) > 0:
            for video in videos[date_str]:
                with st.container():
                    col_info, col_del = st.columns([4, 1])
                    v_id = video['id']
                    col_info.image(f"https://img.youtube.com/vi/{v_id}/default.jpg", width=120)
                    if col_del.button("🗑️", key=f"del_{video['db_id']}", help="이 영상 삭제"):
                        delete_video_from_db(video['db_id'])
                        st.success("영상이 삭제되었습니다.")
                        st.rerun()
        else:
            st.info("이 날짜에 저장된 영상이 없습니다.")

        st.markdown("---")

    # 캘린더 상단 네비게이션
    st.markdown("<br>", unsafe_allow_html=True)
    col_prev, col_title, col_next = st.columns([1, 10, 1])
    
    with col_prev:
        if st.button("◀", use_container_width=True, help="이전 달로 이동"):
            if st.session_state.month == 1:
                st.session_state.month = 12
                st.session_state.year -= 1
            else:
                st.session_state.month -= 1
            st.rerun()

    with col_title:
        st.markdown(f"<h3 style='text-align: center; margin-top: 0;'>{st.session_state.year}년 {st.session_state.month}월</h3>", unsafe_allow_html=True)

    with col_next:
        if st.button("▶", use_container_width=True, help="다음 달로 이동"):
            if st.session_state.month == 12:
                st.session_state.month = 1
                st.session_state.year += 1
            else:
                st.session_state.month += 1
            st.rerun()

    # 캘린더 렌더링
    render_calendar(st.session_state.year, st.session_state.month, videos)

def target_date_placeholder(now, y, m):
    if now.year == y and now.month == m:
        return now
    return datetime(y, m, 1)

if __name__ == "__main__":
    main()

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
                added_at TEXT NOT NULL,
                calendar_name TEXT DEFAULT '기본 캘린더'
            );
        """))
        # 캘린더 목록 관리 테이블 생성
        s.execute(text("""
            CREATE TABLE IF NOT EXISTS vcalendar_info (
                id SERIAL PRIMARY KEY,
                calendar_name TEXT UNIQUE NOT NULL
            );
        """))
        # 기본 캘린더 초기값 삽입
        s.execute(text("INSERT INTO vcalendar_info (calendar_name) VALUES ('기본 캘린더') ON CONFLICT (calendar_name) DO NOTHING;"))
        
        # 기존 테이블에 calendar_name 컬럼이 없는 경우를 위한 안전장치
        try:
            s.execute(text("ALTER TABLE vcalendar_videos ADD COLUMN IF NOT EXISTS calendar_name TEXT DEFAULT '기본 캘린더'"))
        except:
            pass
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
                            text("INSERT INTO vcalendar_videos (video_date, video_id, video_url, added_at, calendar_name) VALUES (:d, :vid, :url, :a, :c)"),
                            {"d": date_key, "vid": v["id"], "url": v["url"], "a": v.get("added_at", ""), "c": "기본 캘린더"}
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

def load_data_from_db(calendar_name):
    """특정 캘린더의 모든 영상 데이터를 읽어와서 앱 형식에 맞게 변환합니다."""
    try:
        df = conn.query(
            "SELECT * FROM vcalendar_videos WHERE calendar_name = :c ORDER BY added_at ASC", 
            params={"c": calendar_name}, 
            ttl=0
        )
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

def get_calendar_list():
    """vcalendar_info 테이블에서 등록된 모든 캘린더 이름을 가져옵니다."""
    try:
        df = conn.query("SELECT calendar_name FROM vcalendar_info ORDER BY id ASC", ttl=0)
        cals = df['calendar_name'].tolist()
        if not cals:
            return ['기본 캘린더']
        return cals
    except:
        return ['기본 캘린더']

def add_calendar_name_to_db(name):
    """새로운 캘린더 이름을 DB에 영구 등록합니다."""
    try:
        with conn.session as s:
            s.execute(
                text("INSERT INTO vcalendar_info (calendar_name) VALUES (:n) ON CONFLICT (calendar_name) DO NOTHING"),
                {"n": name}
            )
            s.commit()
        return True
    except:
        return False

def add_video_to_db(date_str, video_id, url, calendar_name):
    """영상을 특정 캘린더에 추가합니다."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with conn.session as s:
        s.execute(
            text("INSERT INTO vcalendar_videos (video_date, video_id, video_url, added_at, calendar_name) VALUES (:d, :vid, :u, :a, :c)"),
            {"d": date_str, "vid": video_id, "u": url, "a": now_str, "c": calendar_name}
        )
        s.commit()

def delete_video_from_db(db_id):
    """영상을 DB에서 제거합니다."""
    with conn.session as s:
        s.execute(text("DELETE FROM vcalendar_videos WHERE id = :id"), {"id": db_id})
        s.commit()

def delete_calendar_from_db(calendar_name):
    """특정 캘린더와 그 안의 모든 영상을 DB에서 제거합니다."""
    if calendar_name == '기본 캘린더':
        return False
    try:
        with conn.session as s:
            # 1. 해당 캘린더의 모든 비디오 삭제
            s.execute(text("DELETE FROM vcalendar_videos WHERE calendar_name = :c"), {"c": calendar_name})
            # 2. 캘린더 목록 정보 삭제
            s.execute(text("DELETE FROM vcalendar_info WHERE calendar_name = :c"), {"c": calendar_name})
            s.commit()
        return True
    except:
        return False

# --------------------------------------------------------------------------------
# 2. 메인 대시보드
# --------------------------------------------------------------------------------
def main():
    # 초기화 및 마이그레이션
    init_db()
    migrate_from_json()
    
    # 캘린더 목록 및 현재 캘린더 설정
    cal_list = get_calendar_list()
    if 'current_calendar' not in st.session_state:
        st.session_state.current_calendar = cal_list[0]
    
    # [보완] 현재 선택된 캘린더가 DB 목록에 아직 없다면(신규 생성 직후) 목록에 추가
    if st.session_state.current_calendar not in cal_list:
        cal_list.append(st.session_state.current_calendar)
        cal_list.sort()
    
    # 데이터 로드 (선택된 캘린더 기준)
    videos = load_data_from_db(st.session_state.current_calendar)
    
    st.title("📅 Y-Calendar")
    st.markdown(f"**현재 캘린더:** `{st.session_state.current_calendar}`")
    st.markdown("유튜브 영상을 기록하고 썸네일로 확인하는 스마트 캘린더입니다.")

    now = datetime.now()

    # 사이드바: 멀티 캘린더 관리 및 기능 정리
    with st.sidebar:
        st.header("📂 캘린더 선택")
        # 캘린더 스위칭 (현재 리스트에 맞게 index 설정)
        try:
            curr_index = cal_list.index(st.session_state.current_calendar)
        except ValueError:
            curr_index = 0
            
        selected_cal = st.selectbox("진행 중인 캘린더", cal_list, index=curr_index)
        if selected_cal != st.session_state.current_calendar:
            st.session_state.current_calendar = selected_cal
            st.rerun()
            
        # 캘린더 삭제 UI (기본 캘린더 제외)
        if st.session_state.current_calendar != '기본 캘린더':
            with st.expander("🗑️ 현재 캘린더 삭제"):
                st.warning(f"'{st.session_state.current_calendar}'의 모든 영상이 영구 삭제됩니다.")
                if st.button("정말 삭제할까요?", use_container_width=True):
                    if delete_calendar_from_db(st.session_state.current_calendar):
                        st.session_state.current_calendar = '기본 캘린더'
                        st.success("캘린더가 성공적으로 삭제되었습니다.")
                        st.rerun()
                    else:
                        st.error("삭제 중 오류가 발생했습니다.")

        # 새 캘린더 추가
        with st.expander("➕ 새 캘린더 추가"):
            new_cal_name = st.text_input("캘린더 이름 입력", placeholder="나의 운동 기록 등")
            if st.button("신규 생성", use_container_width=True):
                if new_cal_name and new_cal_name not in cal_list:
                    # DB에 즉시 등록하여 빈 캘린더 보존
                    if add_calendar_name_to_db(new_cal_name):
                        st.session_state.current_calendar = new_cal_name
                        st.success(f"'{new_cal_name}' 캘린더가 생성되었습니다.")
                        st.rerun()
                    else:
                        st.error("캘린더 생성에 실패했습니다.")
                elif new_cal_name in cal_list:
                    st.warning("이미 존재하는 이름입니다.")

        st.markdown("---")
        
        if 'year' not in st.session_state:
            st.session_state.year = now.year
        if 'month' not in st.session_state:
            st.session_state.month = now.month

        st.header("🎥 새 영상 등록")
        
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
                    add_video_to_db(date_str, v_id, yt_url, st.session_state.current_calendar)
                    st.success(f"'{st.session_state.current_calendar}'에 영상이 추가되었습니다!")
                    st.rerun()
                else:
                    st.error("유효한 유튜브 URL을 입력해주세요.")

        # 선택된 날짜의 영상 관리 섹션
        st.markdown("---")
        # 요일 계산 (한국어)
        weekdays = ["월", "화", "수", "목", "금", "토", "일"]
        weekday_str = weekdays[target_date.weekday()]
        date_display = target_date.strftime(f"%Y-%m-%d ({weekday_str})")
        
        st.subheader(f"📋 {date_display} 관리")
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

    # 캘린더 상단 네비게이션 (반응형 최적화)
    st.markdown("<br>", unsafe_allow_html=True)
    
    # 캘린더가 최대 1100px이므로 내비게이션도 그에 맞춰 중앙 집중 배치
    _, nav_container, _ = st.columns([1, 1, 1]) # 넓게 3등분
    
    with nav_container:
        # 버튼과 제목 사이의 간격을 '1cm' 느낌으로 긴밀하게 유지 (비율 조정)
        # 사용자님의 요청에 따른 [2, 3, 2] 비율 적용
        col_prev, col_title, col_next = st.columns([2, 3, 2])
        
        with col_prev:
            if st.button("◀", use_container_width=True, help="이전 달"):
                if st.session_state.month == 1:
                    st.session_state.month = 12
                    st.session_state.year -= 1
                else:
                    st.session_state.month -= 1
                st.rerun()

        with col_title:
            # 연도.월 표시 (반응형으로 텍스트 크기가 자동 조절되도록 스타일링)
            st.markdown(f"<p style='text-align: center; font-size: clamp(1rem, 4vw, 1.3rem); font-weight: 800; margin-top: 5px; white-space: nowrap;'>{st.session_state.year}. {st.session_state.month:02d}</p>", unsafe_allow_html=True)

        with col_next:
            if st.button("▶", use_container_width=True, help="다음 달"):
                if st.session_state.month == 12:
                    st.session_state.month = 1
                    st.session_state.year += 1
                else:
                    st.session_state.month += 1
                st.rerun()

    # 캘린더 렌더링
    render_calendar(st.session_state.year, st.session_state.month, videos)

def target_date_placeholder(now, y, m):
    """제안 날짜가 오늘(max_value)을 초과하지 않도록 제한합니다."""
    target = datetime(y, m, 1).date()
    
    # 만약 현재 보고 있는 년/월이 현재 시점이라면 오늘 날짜 반환
    if now.year == y and now.month == m:
        return now.date()
        
    # 제안 날짜가 오늘보다 미래라면 오늘 날짜로 캡핑 (오류 방지)
    return min(target, now.date())

if __name__ == "__main__":
    main()

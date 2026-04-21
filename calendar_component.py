import streamlit as st
import streamlit.components.v1 as components
import calendar
from datetime import datetime

def render_calendar(year, month, videos):
    """유튜브 썸네일이 포함된 프리미엄 캘린더를 렌더링합니다."""
    
    import json
    
    # 일요일부터 시작하도록 설정
    calendar.setfirstweekday(calendar.SUNDAY)
    
    # 해당 월의 일수와 시작 요일 계산
    cal = calendar.monthcalendar(year, month)
    # 월 이름 가져오기
    month_name = calendar.month_name[month]
    
    now = datetime.now()
    
    # 데이터를 JS로 전달하기 위해 JSON 변환
    videos_json = json.dumps(videos)
    
    # HTML/CSS 구성 (반응형 최적화 + 모달 추가)
    html_code = f"""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        body {{
            background-color: transparent;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            margin: 0;
            overflow-x: hidden;
        }}
        
        .calendar-container {{
            background: rgba(30, 33, 48, 0.5);
            backdrop-filter: blur(15px);
            border-radius: 24px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            width: 98%;
            max-width: 1100px;
            margin: 0 auto;
            box-sizing: border-box;
        }}
        
        .calendar-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }}
        
        .month-name {{
            font-size: clamp(20px, 5vw, 32px);
            font-weight: 800;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #fff 30%, #888 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        
        .calendar-grid {{
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: clamp(6px, 1.5vw, 14px);
        }}
        
        .weekday {{
            text-align: center;
            font-weight: 800;
            font-size: clamp(12px, 2vw, 16px);
            color: #ffffff;
            padding-bottom: 15px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 10px;
        }}
        
        .day-cell {{
            aspect-ratio: 1 / 1;
            background: rgba(255, 255, 255, 0.03);
            border-radius: clamp(8px, 1.5vw, 16px);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            padding: clamp(4px, 1vw, 10px);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 1px solid rgba(255, 255, 255, 0.05);
            overflow: hidden;
        }}
        
        .day-cell:hover {{
            background: rgba(255, 255, 255, 0.08);
            transform: scale(1.03) translateY(-5px);
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            z-index: 10;
        }}
        
        .day-number {{
            font-size: clamp(10px, 2.5vw, 14px);
            font-weight: 600;
            z-index: 5;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }}
        
        .empty-cell {{
            visibility: hidden;
        }}
        
        .today {{
            border: 2px solid #ff4b4b;
            background: rgba(255, 75, 75, 0.1);
        }}
        
        .thumbnail-container {{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }}
        
        .thumbnail-img {{
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.6;
            transition: opacity 0.3s, transform 0.5s;
        }}
        
        .day-cell:hover .thumbnail-img {{
            opacity: 0.95;
            transform: scale(1.1);
        }}
        
        .video-link {{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 8;
            cursor: pointer;
        }}
        
        .multi-badge {{
            position: absolute;
            bottom: clamp(4px, 1vw, 8px);
            right: clamp(4px, 1vw, 8px);
            background: rgba(255, 75, 75, 0.95);
            color: white;
            padding: 2px clamp(4px, 1vw, 8px);
            border-radius: 10px;
            font-size: clamp(8px, 1.5vw, 11px);
            font-weight: 800;
            z-index: 9;
            box-shadow: 0 4px 10px rgba(255, 0, 0, 0.4);
            border: 1px solid rgba(255,255,255,0.2);
        }}
        
        .has-video .day-number {{
            background: rgba(0,0,0,0.4);
            padding: 2px 8px;
            border-radius: 8px;
            backdrop-filter: blur(8px);
        }}

        /* 모달 스타일 */
        #video-modal {{
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease;
        }}
        
        .modal-content {{
            background: rgba(30, 33, 48, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 30px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }}
        
        .modal-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }}
        
        .modal-title {{
            font-size: 20px;
            font-weight: 800;
        }}
        
        .close-btn {{
            cursor: pointer;
            font-size: 24px;
            opacity: 0.6;
            transition: 0.2s;
        }}
        
        .close-btn:hover {{
            opacity: 1;
        }}
        
        .modal-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 15px;
        }}
        
        .modal-item {{
            cursor: pointer;
            border-radius: 12px;
            overflow: hidden;
            transition: 0.3s;
            border: 1px solid rgba(255,255,255,0.1);
            aspect-ratio: 16/9;
            position: relative;
        }}
        
        .modal-item:hover {{
            transform: scale(1.05);
            border-color: #ff4b4b;
        }}
        
        .modal-item img {{
            width: 100%;
            height: 100%;
            object-fit: cover;
        }}

        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}

        /* 모바일 대응 미디어 쿼리 */
        @media (max-width: 768px) {{
            .calendar-container {{
                padding: 15px;
                border-radius: 16px;
            }}
            .calendar-header {{
                margin-bottom: 15px;
            }}
        }}

        @media (max-width: 480px) {{
            .calendar-grid {{
                gap: 4px;
            }}
            .day-cell {{
                padding: 4px;
            }}
            .multi-badge {{
                padding: 1px 4px;
                font-size: 8px;
            }}
        }}
    </style>
    
    <div class="calendar-container">
        <div class="calendar-header">
            <div class="month-name">{month_name} {year}</div>
        </div>
        <div class="calendar-grid">
            <div class="weekday">일</div>
            <div class="weekday">월</div>
            <div class="weekday">화</div>
            <div class="weekday">수</div>
            <div class="weekday">목</div>
            <div class="weekday">금</div>
            <div class="weekday">토</div>
    """
    
    for week in cal:
        for day in week:
            if day == 0:
                html_code += '<div class="day-cell empty-cell"></div>'
            else:
                date_key = f"{year}-{month:02d}-{day:02d}"
                is_today = (day == now.day and month == now.month and year == now.year)
                today_class = "today" if is_today else ""
                
                cell_content = ""
                has_video_class = ""
                onclick_event = ""
                
                if date_key in videos and len(videos[date_key]) > 0:
                    has_video_class = "has-video"
                    video_list = videos[date_key]
                    count = len(video_list)
                    
                    # 가장 최근에 추가된 영상을 대표로 표시
                    main_video = video_list[-1]
                    v_id = main_video["id"]
                    v_url = main_video["url"]
                    thumb_url = f"https://img.youtube.com/vi/{v_id}/hqdefault.jpg"
                    
                    badge_html = f'<div class="multi-badge">+{count-1}</div>' if count > 1 else ""
                    
                    # 로직 적용: 2개 이상일 때만 모달
                    if count >= 2:
                        onclick_event = f'onclick="openModal(\'{date_key}\')"'
                        cell_content = f"""
                            <div class="thumbnail-container">
                                <img src="{thumb_url}" class="thumbnail-img">
                            </div>
                            {badge_html}
                        """
                    else:
                        # 1개일 때는 직접 이동
                        cell_content = f"""
                            <div class="thumbnail-container">
                                <img src="{thumb_url}" class="thumbnail-img">
                            </div>
                            <a href="{v_url}" target="_blank" class="video-link" title="최신 영상 열기"></a>
                        """
                
                html_code += f"""
                <div class="day-cell {today_class} {has_video_class}" {onclick_event}>
                    <span class="day-number">{day}</span>
                    {cell_content}
                </div>
                """
    
    html_code += f"""
        </div>
    </div>

    <!-- 모달 레이아웃 -->
    <div id="video-modal" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <div class="modal-title" id="modal-date-title">영상 선택</div>
                <div class="close-btn" onclick="closeModal()">&times;</div>
            </div>
            <div class="modal-grid" id="modal-video-grid">
                <!-- 썸네일 리스트 동적 삽입 -->
            </div>
        </div>
    </div>

    <script>
        const videosData = {videos_json};
        
        function openModal(date) {{
            const modal = document.getElementById('video-modal');
            const grid = document.getElementById('modal-video-grid');
            const title = document.getElementById('modal-date-title');
            
            title.innerText = date + " 영상 리스트";
            grid.innerHTML = ''; // 초기화
            
            const list = videosData[date];
            if (list) {{
                list.forEach(video => {{
                    const item = document.createElement('a');
                    item.href = video.url;
                    item.target = "_blank";
                    item.className = 'modal-item';
                    item.innerHTML = `<img src="https://img.youtube.com/vi/${{video.id}}/hqdefault.jpg">`;
                    grid.appendChild(item);
                }});
            }}
            
            modal.style.display = 'flex';
        }}
        
        function closeModal(event) {{
            document.getElementById('video-modal').style.display = 'none';
        }}
    </script>
    """
    
    # 렌더링 (너비는 가변형으로, 높이는 충분히 확보)
    components.html(html_code, height=900, scrolling=False)

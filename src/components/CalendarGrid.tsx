'use client';

import { Plus, MonitorPlay as Youtube, Image as ImageIcon, FileText, Clock } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { memo } from 'react';
import { Video } from '@/lib/types';

interface EnhancedContent extends Video {
  media_type?: 'video' | 'photo' | 'note';
  image_url?: string;
  note_content?: string;
}

interface Props {
  days: Date[];
  videos: { [key: string]: EnhancedContent[] };
  onCellClick: (date: string, items: EnhancedContent[]) => void;
}

export const CalendarGrid = memo(({ days, videos, onCellClick }: Props) => {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <div key={d} className="text-[9px] font-black text-slate-600 text-center py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayItems = videos[dateStr] || [];
          const hasContent = dayItems.length > 0;
          
          // 데이터 종류별 찾기
          const photoItem = dayItems.find(item => item.media_type === 'photo');
          const videoItem = dayItems.find(item => item.media_type === 'video');
          const noteItem = dayItems.find(item => item.media_type === 'note');
          
          const totalMin = Math.round(dayItems.reduce((s, c) => s + (c.duration || 0), 0) / 60);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={dateStr} 
              onClick={() => onCellClick(dateStr, dayItems)}
              className={`aspect-square relative rounded-xl overflow-hidden border transition-all active:scale-95 cursor-pointer group 
                ${hasContent ? 'border-red-500/30 bg-black shadow-lg shadow-red-500/5' : 'border-white/5 bg-[#1e293b]/30'}
                ${isToday ? 'ring-2 ring-white/40 bg-white/5' : ''}
                ${noteItem ? 'ring-1 ring-amber-500/20' : ''}`}
            >
              {/* 날짜 번호 */}
              <span className={`absolute top-1 left-1.5 text-[9px] font-black z-30 ${hasContent ? 'text-white' : 'text-slate-500'}`}>
                {format(day, 'd')}
              </span>
              
              {hasContent ? (
                <div className="w-full h-full">
                  {/* 배경 레이어: 사진 우선 > 영상 */}
                  {photoItem && (
                    <img src={photoItem.image_url} className="w-full h-full object-cover opacity-50" alt="photo" />
                  )}
                  {!photoItem && videoItem && (
                    <img src={`https://img.youtube.com/vi/${videoItem.video_id}/mqdefault.jpg`} className="w-full h-full object-cover opacity-40" alt="video" />
                  )}

                  {/* 메모 내용 (중앙 배치) */}
                  {noteItem && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center p-2 z-20">
                      <p className="text-[8px] sm:text-[9px] text-amber-200 line-clamp-3 text-center leading-tight font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        {noteItem.note_content}
                      </p>
                    </div>
                  )}

                  {/* 하단 정보 표시 */}
                  <div className="absolute bottom-1 right-1 flex flex-col items-end gap-0.5 z-30">
                    <div className="flex gap-0.5 mb-0.5 opacity-60">
                      {videoItem && <Youtube size={10} className="text-red-500" />}
                      {photoItem && <ImageIcon size={10} className="text-blue-400" />}
                      {noteItem && <FileText size={10} className="text-amber-400" />}
                    </div>
                    {totalMin > 0 && (
                      <span className="bg-black/80 backdrop-blur-sm text-[6px] font-black px-1 py-0.5 rounded text-white border border-white/10">
                        {totalMin}m
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-10 group-hover:opacity-100 transition-opacity">
                   <Plus size={12} className="text-slate-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

CalendarGrid.displayName = 'CalendarGrid';

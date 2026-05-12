'use client';

import { Plus, MonitorPlay as Youtube, Image as ImageIcon, FileText, Clock } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { memo } from 'react';
import { Video } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedContent extends Video {
  media_type?: 'video' | 'photo' | 'note';
  image_url?: string;
  note_content?: string;
}

interface Props {
  days: Date[];
  videos: { [key: string]: EnhancedContent[] };
  onCellClick: (date: string, items: EnhancedContent[]) => void;
  filter: 'all' | 'video' | 'photo' | 'note';
}

export const CalendarGrid = memo(({ days, videos, onCellClick, filter }: Props) => {
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
        <div key={day} className="text-[10px] font-black text-slate-600 text-center pb-2 tracking-widest">{day}</div>
      ))}
      
      {days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayItems = videos[dateStr] || [];
        const isToday = isSameDay(day, today);
        
        // 필터링 로직 적용
        const filteredItems = filter === 'all' 
          ? dayItems 
          : dayItems.filter(item => item.media_type === filter);

        const hasContent = filteredItems.length > 0;
        
        // 우선순위에 따른 대표 아이템 결정
        const photoItem = filteredItems.find(item => item.media_type === 'photo');
        const videoItem = filteredItems.find(item => item.media_type === 'video');
        const noteItem = filteredItems.find(item => item.media_type === 'note');
        
        const displayItem = photoItem || videoItem || noteItem;

        return (
          <motion.div
            layout
            key={dateStr}
            onClick={() => onCellClick(dateStr, dayItems)}
            className={`
              relative aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center cursor-pointer 
              transition-all duration-500 overflow-hidden group
              ${isToday ? 'bg-white/10 ring-2 ring-white/20' : 'bg-[#1e293b]/40 hover:bg-[#1e293b]/60'}
              ${hasContent ? 'shadow-xl' : 'border border-white/[0.03]'}
            `}
          >
            {/* 오늘 날짜 표시 */}
            <div className={`absolute top-1.5 sm:top-2 left-1.5 sm:left-2 text-[10px] font-bold z-20 ${isToday ? 'text-white' : 'text-slate-500'}`}>
              {format(day, 'd')}
            </div>

            {/* 배경 이미지 (사진/영상 썸네일) */}
            <AnimatePresence mode="wait">
              {hasContent && displayItem && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0">
                  {displayItem.media_type === 'photo' && displayItem.image_url && (
                    <img src={displayItem.image_url} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700" alt="record" />
                  )}
                  {displayItem.media_type === 'video' && displayItem.video_id && (
                    <img src={`https://img.youtube.com/vi/${displayItem.video_id}/mqdefault.jpg`} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-700" alt="youtube" />
                  )}
                  {/* 메모가 있을 때의 은은한 배경 배경 처리 */}
                  {displayItem.media_type === 'note' && (
                    <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[2px]" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 중앙 메모 오버레이 (향상된 가독성) */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {hasContent && noteItem && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="px-2 text-center">
                   <p className="text-[9px] sm:text-[11px] font-bold text-amber-300 line-clamp-2 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-tighter">
                    {noteItem.note_content}
                  </p>
                </motion.div>
              )}
              
              {!hasContent && (
                <Plus size={14} className="text-slate-700 group-hover:text-slate-400 group-hover:scale-125 transition-all duration-300" />
              )}
            </div>

            {/* 상태 뱃지 (우측 하단) */}
            <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 z-20">
              {dayItems.some(i => i.media_type === 'video') && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
              {dayItems.some(i => i.media_type === 'photo') && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
              {dayItems.some(i => i.media_type === 'note') && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />}
            </div>

            {/* 호버 효과 글로우 */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
          </motion.div>
        );
      })}
    </div>
  );
});

CalendarGrid.displayName = 'CalendarGrid';

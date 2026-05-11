'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Video } from '@/lib/types';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// 분리된 컴포넌트 임포트
import { CalendarHeader } from '../components/CalendarHeader';
import { CalendarGrid } from '../components/CalendarGrid';
import { AddContentModal } from '../components/AddContentModal';
import { BottomNav } from '../components/BottomNav';

const StatsDashboard = dynamic(() => import('../components/StatsDashboard'), {
  loading: () => <div className="h-80 bg-[#1e293b]/30 animate-pulse rounded-3xl" />,
  ssr: false
});

const DetailModal = dynamic(() => import('../components/DetailModal'), {
  ssr: false
});

interface EnhancedContent extends Video {
  media_type?: 'video' | 'photo' | 'note';
  image_url?: string;
  note_content?: string;
}

type EnhancedVideosByDate = { [key: string]: EnhancedContent[] };

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [videos, setVideos] = useState<EnhancedVideosByDate>({});
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedItems, setSelectedItems] = useState<EnhancedContent[]>([]);
  
  const [mediaType, setMediaType] = useState<'video' | 'photo' | 'note'>('video');
  const [newUrl, setNewUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/videos?calendar=기본 캘린더');
      const data: EnhancedContent[] = await res.json();
      
      const grouped = data.reduce((acc: EnhancedVideosByDate, content) => {
        let dateObj: Date;
        const rawDate = content.video_date as any;
        if (rawDate instanceof Date) {
          dateObj = rawDate;
        } else if (typeof rawDate === 'string') {
          dateObj = rawDate.includes('T') ? parseISO(rawDate) : new Date(rawDate);
        } else {
          dateObj = new Date(rawDate);
        }
        const dateStr = format(dateObj, 'yyyy-MM-dd');
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push({ ...content, video_date: dateStr });
        return acc;
      }, {});
      setVideos(grouped);
      if (selectedDate) setSelectedItems(grouped[selectedDate] || []);
    } catch (error) {
      console.error('Failed to fetch content', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleAddContent = async (e: React.FormEvent, file?: File) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let res;
      // 사진 업로드라면 FormData 사용
      if (mediaType === 'photo' && file) {
        const formData = new FormData();
        formData.append('media_type', 'photo');
        formData.append('video_date', selectedDate);
        formData.append('calendar_name', '기본 캘린더');
        formData.append('file', file);
        
        res = await fetch('/api/videos', {
          method: 'POST',
          body: formData
        });
      } else {
        // 영상이나 메모는 기존처럼 JSON 사용
        res = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: mediaType,
            video_url: mediaType === 'video' ? newUrl : null,
            image_url: null,
            note_content: mediaType === 'note' ? newNote : null,
            video_date: selectedDate,
            calendar_name: '기본 캘린더'
          })
        });
      }

      if (res.ok) {
        setNewUrl(''); setNewImageUrl(''); setNewNote('');
        setIsAddModalOpen(false); fetchVideos();
      } else {
        const errorData = await res.json();
        alert(`저장 실패: ${errorData.error || '상세 사유 모름'}`);
      }
    } catch (error: any) {
      console.error('Save Error:', error);
      alert(`네트워크 오차: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContent = async (id: number) => {
    try {
      const res = await fetch('/api/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchVideos();
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const days = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  }), [currentMonth]);

  const { statsData, totalWeeklyMinutes } = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const currentWeekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    let weekMinutes = 0;
    const formattedData = currentWeekDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayContent = videos[dateStr] || [];
      const mins = Math.round(dayContent.reduce((sum, c) => sum + (c.duration || 0), 0) / 60);
      weekMinutes += mins;
      return { name: format(date, 'EEE').toUpperCase(), minutes: mins, date: dateStr };
    });
    return { statsData: formattedData, totalWeeklyMinutes: weekMinutes };
  }, [videos]);

  const handleCellClick = useCallback((date: string, items: EnhancedContent[]) => {
    setSelectedDate(date);
    if (items.length > 0) {
      setSelectedItems(items);
      setIsDetailModalOpen(true);
    } else {
      setIsAddModalOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24 select-none">
      <CalendarHeader 
        currentMonth={currentMonth} activeTab={activeTab}
        onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
        onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
      />

      <main className="p-4 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'calendar' ? (
            <motion.div key="calendar" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <CalendarGrid days={days} videos={videos} onCellClick={handleCellClick} />
            </motion.div>
          ) : (
            <motion.div key="stats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StatsDashboard statsData={statsData} totalWeeklyMinutes={totalWeeklyMinutes} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddContentModal 
        isOpen={isAddModalOpen} mediaType={mediaType} targetDate={selectedDate} 
        newUrl={newUrl} newImageUrl={newImageUrl} newNote={newNote} isSubmitting={isSubmitting}
        onClose={() => setIsAddModalOpen(false)} setMediaType={setMediaType} setTargetDate={setSelectedDate}
        setNewUrl={setNewUrl} setNewImageUrl={setNewImageUrl} setNewNote={setNewNote} onSubmit={handleAddContent}
      />

      <DetailModal 
        isOpen={isDetailModalOpen} date={selectedDate} items={selectedItems} 
        onClose={() => setIsDetailModalOpen(false)} onDelete={handleDeleteContent}
      />

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onAddClick={() => {
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        setIsAddModalOpen(true);
      }} />

      {loading && (
        <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center z-[200]">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Video } from '@/lib/types';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorPlay as Youtube, Image as ImageIcon, FileText, Layers, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// 분리된 컴포넌트 임포트
import { CalendarHeader } from '../components/CalendarHeader';
import { CalendarGrid } from '../components/CalendarGrid';
import { AddContentModal } from '../components/AddContentModal';
import { BottomNav } from '../components/BottomNav';
import Login from '../components/Login';

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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [videos, setVideos] = useState<EnhancedVideosByDate>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'video' | 'photo' | 'note'>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedItems, setSelectedItems] = useState<EnhancedContent[]>([]);
  
  const [mediaType, setMediaType] = useState<'video' | 'photo' | 'note'>('video');
  const [newUrl, setNewUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 인증 상태 감시
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchVideos = useCallback(async () => {
    if (!user) return;
    try {
      // API 호출 시 사용자 ID를 쿼리로 전달 (서버사이드에서 사용)
      const res = await fetch(`/api/videos?calendar=기본 캘린더&userId=${user.id}`);
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
  }, [selectedDate, user]);

  useEffect(() => {
    if (user) fetchVideos();
  }, [fetchVideos, user]);

  const handleAddContent = async (e: React.FormEvent, file?: File) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      let res;
      if (mediaType === 'photo' && file) {
        const formData = new FormData();
        formData.append('media_type', 'photo');
        formData.append('video_date', selectedDate);
        formData.append('calendar_name', '기본 캘린더');
        formData.append('file', file);
        formData.append('user_id', user.id); // 사용자 ID 추가
        res = await fetch('/api/videos', { method: 'POST', body: formData });
      } else {
        res = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: mediaType,
            video_url: mediaType === 'video' ? newUrl : null,
            image_url: null,
            note_content: mediaType === 'note' ? newNote : null,
            video_date: selectedDate,
            calendar_name: '기본 캘린더',
            user_id: user.id // 사용자 ID 추가
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  // 로딩 중 화면
  if (authLoading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;

  // 로그인 안된 경우 로그인 화면 표시
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24 select-none">
      <CalendarHeader 
        currentMonth={currentMonth} activeTab={activeTab}
        onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
        onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
      />

      <main className="p-4 overflow-x-hidden">
        {/* 미디어 필터 바 */}
        <AnimatePresence>
          {activeTab === 'calendar' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="flex gap-2 mb-6 px-3 py-3 overflow-x-auto custom-scrollbar bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md sticky top-0 z-40"
            >
              {[
                { id: 'all', label: '전체보기', icon: Layers, color: 'text-white', bg: 'bg-white/20' },
                { id: 'video', label: '영상기록', icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10' },
                { id: 'photo', label: '사진기록', icon: ImageIcon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { id: 'note', label: '메모기록', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' }
              ].map((f) => (
                <button 
                  key={f.id} 
                  onClick={() => setFilter(f.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-500 border ${filter === f.id ? `${f.bg} border-white/30 shadow-lg scale-105 z-10` : 'bg-transparent border-white/5 opacity-40 hover:opacity-100 hover:bg-white/5'}`}
                >
                  <f.icon size={16} className={f.color} />
                  <span className={`text-[11px] font-black tracking-tight ${filter === f.id ? 'text-white' : 'text-slate-400'}`}>{f.label}</span>
                </button>
              ))}
              {/* 로그아웃 버튼 추가 */}
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-500 border bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:border-red-500/30">
                <LogOut size={16} className="text-slate-400" />
                <span className="text-[11px] font-black tracking-tight text-slate-400">로그아웃</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'calendar' ? (
            <motion.div key="calendar" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <CalendarGrid days={days} videos={videos} onCellClick={handleCellClick} filter={filter} />
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
        <div className="fixed inset-0 bg-[#0f172a]/50 flex items-center justify-center z-[200]">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
        </div>
      )}
    </div>
  );
}

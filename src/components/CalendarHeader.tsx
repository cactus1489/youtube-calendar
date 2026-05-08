'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { memo } from 'react';

interface Props {
  currentMonth: Date;
  activeTab: 'calendar' | 'stats';
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const CalendarHeader = memo(({ currentMonth, activeTab, onPrevMonth, onNextMonth }: Props) => {
  return (
    <header className="p-6 bg-[#1e293b]/50 backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-red-500 italic">MY DIARY</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em]">
            {activeTab === 'calendar' ? format(currentMonth, 'MMMM yyyy').toUpperCase() : 'WEEKLY DASHBOARD'}
          </p>
        </div>
        {activeTab === 'calendar' && (
          <div className="flex gap-1 bg-black/20 p-1 rounded-full border border-white/5">
            <button onClick={onPrevMonth} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
              <ChevronLeft size={20} />
            </button>
            <button onClick={onNextMonth} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
});

CalendarHeader.displayName = 'CalendarHeader';

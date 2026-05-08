'use client';

import { MonitorPlay, BarChart3, Plus } from 'lucide-react';
import { memo } from 'react';

interface Props {
  activeTab: 'calendar' | 'stats';
  setActiveTab: (tab: 'calendar' | 'stats') => void;
  onAddClick: () => void;
}

export const BottomNav = memo(({ activeTab, setActiveTab, onAddClick }: Props) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e293b]/90 backdrop-blur-xl border-t border-white/5 px-8 pt-4 pb-8 flex justify-between items-center z-40">
      <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'calendar' ? 'text-white' : 'text-slate-500'}`}>
        <MonitorPlay size={22} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} />
        <span className="text-[9px] font-black tracking-tighter">DIARY</span>
      </button>
      
      <button onClick={onAddClick} className="bg-red-500 p-4 rounded-2xl shadow-lg -mt-16 border-4 border-[#0f172a] active:scale-95 transition-all group">
        <Plus size={26} color="white" strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-white' : 'text-slate-500'}`}>
        <BarChart3 size={22} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
        <span className="text-[9px] font-black tracking-tighter">PROGRESS</span>
      </button>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

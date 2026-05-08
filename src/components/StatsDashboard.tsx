'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { isSameDay, parseISO } from 'date-fns';
import { memo } from 'react';

interface Props {
  statsData: { name: string; minutes: number; date: string }[];
  totalWeeklyMinutes: number;
}

const StatsDashboard = ({ statsData, totalWeeklyMinutes }: Props) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#1e293b] rounded-3xl p-6 border border-white/5 shadow-xl">
        <p className="text-xs font-black text-slate-400 mb-1 uppercase tracking-tighter text-center">Weekly Training Time</p>
        <div className="flex justify-center items-baseline gap-2">
          <h2 className="text-5xl font-black text-red-500">{totalWeeklyMinutes}</h2>
          <span className="text-lg font-bold text-slate-300 italic uppercase">Min</span>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-3xl p-6 border border-white/5 shadow-xl h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statsData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} dy={10} />
            <YAxis hide />
            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', borderRadius: '12px', border: 'none'}} itemStyle={{color: '#ef4444', fontWeight: '900'}} />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
              {statsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={isSameDay(parseISO(entry.date), new Date()) ? '#ffffff' : (entry.minutes > 0 ? '#ef4444' : '#334155')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default memo(StatsDashboard);

'use client';

import { X, MonitorPlay as Youtube, Image as ImageIcon, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import { Video } from '@/lib/types';

interface EnhancedContent extends Video {
  media_type?: 'video' | 'photo' | 'note';
  image_url?: string;
  note_content?: string;
}

interface Props {
  isOpen: boolean;
  date: string;
  items: EnhancedContent[];
  onClose: () => void;
  onDelete: (id: number) => void;
}

const DetailModal = ({ isOpen, date, items, onClose, onDelete }: Props) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-[#1e293b] w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* 헤더 */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f172a]/50">
              <div>
                <h2 className="text-xl font-black italic text-red-500 tracking-tighter">DAILY RECORDS</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-widest">{date}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* 본문 리스트 */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="bg-[#0f172a]/50 rounded-2xl overflow-hidden border border-white/5 relative group">
                  
                  {/* 삭제 버튼 */}
                  <button 
                    onClick={() => { if(confirm('이 기록을 삭제할까요?')) item.id && onDelete(item.id) }} 
                    className="absolute top-3 right-3 z-30 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* 사진 타입 */}
                  {item.media_type === 'photo' && (
                    <div className="space-y-4">
                      <img src={item.image_url} className="w-full object-contain max-h-80 bg-black/20" alt="record" />
                      <div className="px-5 pb-5 flex items-center gap-2 text-blue-400">
                        <ImageIcon size={16} />
                        <span className="text-xs font-black uppercase tracking-tighter">Photo Record</span>
                      </div>
                    </div>
                  )}

                  {/* 영상 타입 */}
                  {item.media_type === 'video' && (
                    <div className="block">
                      <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="relative block aspect-video group/video">
                        <img src={`https://img.youtube.com/vi/${item.video_id}/maxresdefault.jpg`} className="w-full h-full object-cover" alt="youtube" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity">
                          <ExternalLink size={32} className="text-white animate-pulse" />
                        </div>
                      </a>
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-2">{item.video_title}</h3>
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-1.5 text-red-500">
                            <Youtube size={14} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Youtube Training</span>
                          </div>
                          {item.duration && item.duration > 0 && (
                            <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-400 font-bold">{Math.round(item.duration/60)} min</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 메모 타입 */}
                  {item.media_type === 'note' && (
                    <div className="p-6 bg-amber-500/5">
                      <div className="flex items-center gap-2 text-amber-500 mb-4">
                        <FileText size={16} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Daily Note</span>
                      </div>
                      <p className="text-sm text-amber-50/90 leading-relaxed font-medium whitespace-pre-wrap">
                        {item.note_content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-slate-500 py-10">기록이 없습니다.</p>}
            </div>

            <div className="p-6 bg-[#0f172a]/50">
              <button onClick={onClose} className="w-full py-4 bg-white text-[#0f172a] font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xs tracking-widest uppercase">
                Close
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(DetailModal);

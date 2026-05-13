'use client';

import { X, MonitorPlay as Youtube, Image as ImageIcon, FileText, Plus, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { memo, useRef, useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  mediaType: 'video' | 'photo' | 'note';
  targetDate: string;
  newUrl: string;
  newImageUrl: string;
  newNote: string;
  isSubmitting: boolean;
  onClose: () => void;
  setMediaType: (type: 'video' | 'photo' | 'note') => void;
  setTargetDate: (date: string) => void;
  setNewUrl: (url: string) => void;
  setNewImageUrl: (url: string) => void;
  setNewNote: (note: string) => void;
  onSubmit: (e: React.FormEvent, files?: FileList | null) => void;
}

export const AddContentModal = memo(({ 
  isOpen, mediaType, targetDate, newUrl, newImageUrl, newNote, isSubmitting, 
  onClose, setMediaType, setTargetDate, setNewUrl, setNewImageUrl, setNewNote, onSubmit 
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  // 파일 선택 시 프리뷰 생성
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setNewImageUrl(e.target.value || '');
    
    if (files) {
      // 기존 프리뷰 제거 (메모리 해제)
      previews.forEach(p => URL.revokeObjectURL(p));
      
      const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    } else {
      setPreviews([]);
    }
  };

  // 모달 닫힐 때 혹은 언마운트 시 프리뷰 객체 URL 해제
  useEffect(() => {
    if (!isOpen) {
      previews.forEach(p => URL.revokeObjectURL(p));
      setPreviews([]);
    }
    return () => previews.forEach(p => URL.revokeObjectURL(p));
  }, [isOpen]);

  const handleFormSubmit = (e: React.FormEvent) => {
    const files = fileInputRef.current?.files;
    onSubmit(e, files);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-[#1e293b] w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black italic text-red-500 tracking-tighter">ADD MEMORY</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="flex gap-2 p-1 bg-black/20 rounded-2xl border border-white/5">
                {[
                  { id: 'video', icon: Youtube, label: 'Video', color: 'text-red-500' },
                  { id: 'photo', icon: ImageIcon, label: 'Photo', color: 'text-blue-400' },
                  { id: 'note', icon: FileText, label: 'Note', color: 'text-amber-400' }
                ].map((t) => (
                  <button key={t.id} type="button" onClick={() => setMediaType(t.id as any)}
                    className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition-all ${mediaType === t.id ? 'bg-[#334155] shadow-lg scale-105' : 'opacity-40 hover:opacity-60'}`}>
                    <t.icon size={20} className={t.color} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Record Date</label>
                  <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 transition-colors" />
                </div>

                {mediaType === 'video' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">YouTube URL</label>
                    <input type="url" placeholder="https://youtube.com/..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} required
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 transition-colors" />
                  </div>
                )}

                {mediaType === 'photo' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Upload Images</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video bg-black/20 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-black/30 hover:border-blue-400/30 transition-all group overflow-hidden relative"
                    >
                      {previews.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 p-4 w-full h-full overflow-y-auto">
                          {previews.map((src, i) => (
                            <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-white/10">
                              <img src={src} className="w-full h-full object-cover" alt={`preview ${i}`} />
                              {i === 2 && previews.length > 3 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-black">+{previews.length - 3}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <Upload size={32} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center">
                            Click to select from gallery<br/><span className="text-[8px] font-medium opacity-50 lowercase">(jpg, png, gif, heic)</span>
                          </p>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                        multiple
                      />
                    </div>
                  </div>
                )}

                {mediaType === 'note' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Daily Note</label>
                    <textarea placeholder="오늘의 훈련 기록을 남겨보세요..." value={newNote} onChange={(e) => setNewNote(e.target.value)} required
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-colors min-h-[120px] resize-none" />
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={18} /> <span className="tracking-[0.2em] text-xs">SAVE MEMORIES</span></>}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

AddContentModal.displayName = 'AddContentModal';

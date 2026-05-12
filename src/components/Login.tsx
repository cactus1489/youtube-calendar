'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, Calendar, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('회원가입 확인 메일을 보냈습니다. 이메일을 확인해 주세요!');
      }
    } catch (err: any) {
      setError(err.message || '인증 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-[#0f172a] overflow-hidden">
      {/* 배경 장식 애니메이션 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-500/20 rotate-12">
            <Calendar size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Y-Calendar</h1>
          <p className="text-slate-400 text-sm mt-1">당신의 추억을 안전하게 보관하세요</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="email" placeholder="이메일 주소"
              value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="password" placeholder="비밀번호"
              value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-slate-600"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-xs text-center font-bold px-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
            {isLogin ? '로그인 시작하기' : '회원가입 완료하기'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 text-sm hover:text-white transition-colors underline underline-offset-4 decoration-slate-700"
          >
            {isLogin ? '아직 계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

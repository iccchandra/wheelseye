import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { authApi } from '../services/api';

type Step = 'phone' | 'otp';

export const LoginPage: React.FC = () => {
  const [step, setStep]     = useState<Step>('phone');
  const [phone, setPhone]   = useState('');
  const [otp, setOtp]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async () => {
    if (phone.length !== 10) { setError('Enter valid 10-digit mobile number'); return; }
    setLoading(true); setError('');
    try { await authApi.sendOtp(phone); setStep('otp'); }
    catch { setError('Failed to send OTP. Try again.'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await authApi.verifyOtp(phone, otp);
      localStorage.setItem('access_token', res.data.access_token);
      navigate('/dashboard', { replace: true });
    } catch { setError('Invalid or expired OTP'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute w-96 h-96 rounded-full bg-brand-500/10 blur-3xl -top-20 -right-20 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-500/8 blur-3xl -bottom-32 -left-20 animate-pulse [animation-delay:1s]" />
      <div className="absolute w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl top-1/3 left-1/4 animate-pulse [animation-delay:2s]" />

      <div className="relative z-10 bg-slate-900/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-10 w-[400px] shadow-2xl animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-9">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 mx-auto mb-4 flex items-center justify-center shadow-glow">
            <Truck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">FreightTrack</h1>
          <p className="text-slate-400 text-sm mt-1">Fleet operations dashboard</p>
        </div>

        {step === 'phone' ? (
          <>
            <p className="text-slate-400 text-sm text-center mb-5">Sign in with your registered mobile</p>
            <div className="flex gap-2 mb-4">
              <span className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-slate-400 text-sm font-semibold">+91</span>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={e => e.key === 'Enter' && sendOtp()} placeholder="Mobile number" maxLength={10} autoFocus
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-sm placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
            </div>
            {error && <div className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/15 rounded-xl px-4 py-2.5">{error}</div>}
            <button onClick={sendOtp} disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold text-sm shadow-btn-primary hover:shadow-glow disabled:opacity-60 transition-all active:scale-[0.98]">
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-400 text-sm text-center mb-1">OTP sent to <span className="text-white font-semibold">+91 {phone}</span></p>
            <div className="text-center">
              <button onClick={() => setStep('phone')} className="text-brand-400 text-sm font-semibold hover:text-brand-300 mb-5 inline-block">Change number</button>
            </div>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()} placeholder="------" maxLength={6} autoFocus
              className="w-full px-4 py-4 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-2xl font-bold tracking-[14px] text-center placeholder-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 mb-4 transition-all" />
            {error && <div className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/15 rounded-xl px-4 py-2.5">{error}</div>}
            <button onClick={verifyOtp} disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold text-sm shadow-btn-primary hover:shadow-glow disabled:opacity-60 transition-all active:scale-[0.98]">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button onClick={sendOtp}
              className="w-full mt-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 text-sm font-medium hover:bg-white/[0.06] transition-all">
              Resend OTP
            </button>
          </>
        )}

        <p className="text-center text-slate-600 text-[11px] mt-7">Powered by <span className="font-semibold text-slate-500">WheelsEye</span></p>
      </div>
    </div>
  );
};

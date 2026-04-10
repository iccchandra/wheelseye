import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    try {
      await authApi.sendOtp(phone);
      setStep('otp');
    } catch { setError('Failed to send OTP. Try again.'); }
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

  const input: React.CSSProperties = {
    width: '100%', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12, fontSize: 15, background: 'rgba(255,255,255,0.06)',
    color: '#f1f5f9', outline: 'none', backdropFilter: 'blur(8px)',
  };

  const btn: React.CSSProperties = {
    width: '100%', padding: '14px', borderRadius: 12,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
    boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
    letterSpacing: '0.3px',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e293b 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated gradient orbs */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)', top: '-10%', right: '-5%', animation: 'pulse 4s ease infinite' }} />
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)', bottom: '-15%', left: '-10%', animation: 'pulse 5s ease infinite 1s' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)', top: '40%', left: '20%', animation: 'pulse 6s ease infinite 2s' }} />

      <div style={{
        background: 'rgba(15,23,42,0.6)', borderRadius: 24, padding: '44px 40px', width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)', position: 'relative', zIndex: 1,
        animation: 'fadeIn 0.5s ease',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20, fontWeight: 800,
            boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
          }}>FT</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.3px' }}>FreightTrack</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 500 }}>Fleet operations dashboard</div>
        </div>

        {step === 'phone' ? (
          <>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, textAlign: 'center' }}>
              Sign in with your registered mobile
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{
                padding: '14px 14px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
                fontSize: 15, background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
                whiteSpace: 'nowrap', fontWeight: 600,
              }}>+91</span>
              <input
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                placeholder="Mobile number" maxLength={10} autoFocus style={input}
              />
            </div>
            {error && <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.15)' }}>{error}</div>}
            <button onClick={sendOtp} disabled={loading} style={btn}>
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4, textAlign: 'center' }}>
              OTP sent to <span style={{ fontWeight: 700, color: '#e2e8f0' }}>+91 {phone}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setStep('phone')} style={{ fontSize: 13, color: '#60a5fa', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 20, fontWeight: 600 }}>
                Change number
              </button>
            </div>
            <input
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              placeholder="------" maxLength={6} autoFocus
              style={{ ...input, fontSize: 28, letterSpacing: 14, textAlign: 'center', fontWeight: 700, marginBottom: 16 }}
            />
            {error && <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.15)' }}>{error}</div>}
            <button onClick={verifyOtp} disabled={loading} style={btn}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button onClick={sendOtp} style={{
              width: '100%', marginTop: 12, padding: '12px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 600,
            }}>
              Resend OTP
            </button>
          </>
        )}

        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 11, color: '#475569' }}>
          Powered by <span style={{ fontWeight: 600, color: '#64748b' }}>WheelsEye</span>
        </div>
      </div>
    </div>
  );
};

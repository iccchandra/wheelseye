import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { authApi } from '../services/api';
import { useAuth } from '../store/auth';

export const LoginScreen = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuth();

  const sendOtp = async () => {
    if (phone.length !== 10) { setError('Enter valid 10-digit number'); return; }
    setLoading(true); setError('');
    try {
      await authApi.sendOtp(phone);
      setStep('otp');
    } catch { setError('Failed to send OTP'); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await authApi.verifyOtp(phone, otp);
      setAuth(res.data.access_token, res.data.user);
    } catch { setError('Invalid OTP'); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        {/* Logo */}
        <View style={s.logoRow}>
          <View style={s.logoBadge}>
            <Feather name="truck" size={28} color="#fff" />
          </View>
          <View>
            <Text style={s.logoTitle}>FreightTrack</Text>
            <Text style={s.logoSub}>Driver App</Text>
          </View>
        </View>

        {step === 'phone' ? (
          <>
            <Text style={s.label}>Enter your registered mobile number</Text>
            <View style={s.phoneRow}>
              <View style={s.prefix}><Text style={s.prefixText}>+91</Text></View>
              <TextInput style={s.input} value={phone} onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="Mobile number" keyboardType="phone-pad" maxLength={10} />
            </View>
            {error ? <Text style={s.error}>{error}</Text> : null}
            <TouchableOpacity style={s.btn} onPress={sendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.label}>OTP sent to +91 {phone}</Text>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={s.changeNum}>Change number</Text>
            </TouchableOpacity>
            <TextInput style={[s.input, s.otpInput]} value={otp} onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="------" keyboardType="number-pad" maxLength={6} />
            {error ? <Text style={s.error}>{error}</Text> : null}
            <TouchableOpacity style={s.btn} onPress={verifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify & Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.btnGhost} onPress={sendOtp}>
              <Text style={s.btnGhostText}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#1e293b', borderRadius: 24, padding: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 32 },
  logoBadge: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  logoTitle: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  logoSub: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  label: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  prefix: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  prefixText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, fontSize: 15, color: '#f1f5f9', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 12, fontWeight: '700', marginBottom: 16 },
  error: { color: '#f87171', fontSize: 13, marginBottom: 12, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, padding: 10 },
  btn: { backgroundColor: '#2563eb', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnGhost: { borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btnGhostText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  changeNum: { color: '#60a5fa', fontSize: 13, fontWeight: '600', marginBottom: 16 },
});

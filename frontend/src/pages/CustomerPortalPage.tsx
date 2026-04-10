import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const portalApi = {
  signup: (d: any) => api.post('/portal/signup', d),
  login: (d: any) => api.post('/portal/login', d),
  vehicles: () => api.get('/portal/vehicles'),
  book: (d: any) => api.post('/portal/book', d),
  bookings: (params?: any) => api.get('/portal/bookings', { params }),
};

type View = 'login' | 'signup' | 'home' | 'book' | 'bookings';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  INQUIRY:    { bg: 'var(--purple-light)', color: 'var(--purple)', label: 'Inquiry' },
  BOOKED:     { bg: 'var(--accent-light)', color: 'var(--accent)', label: 'Booked' },
  DISPATCHED: { bg: 'var(--orange-light)', color: 'var(--orange)', label: 'Dispatched' },
  IN_TRANSIT: { bg: 'var(--green-light)',  color: 'var(--green)',  label: 'In Transit' },
  DELIVERED:  { bg: 'var(--accent-light)', color: 'var(--accent)', label: 'Delivered' },
  DELAYED:    { bg: 'var(--red-light)',    color: 'var(--red)',    label: 'Delayed' },
  CANCELLED:  { bg: 'var(--bg-tertiary)',  color: 'var(--text-tertiary)', label: 'Cancelled' },
};

export const CustomerPortalPage: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [customer, setCustomer] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', address: '' });
  const [bookForm, setBookForm] = useState({ origin: '', destination: '', cargoDescription: '', weightMT: '', vehicleId: '', scheduledPickup: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    const name = localStorage.getItem('customer_name');
    if (token && name) { setCustomer({ name }); setView('home'); }
  }, []);

  const handleAuth = async (isSignup: boolean) => {
    setLoading(true); setError('');
    try {
      const res = isSignup ? await portalApi.signup(form) : await portalApi.login({ email: form.email, password: form.password });
      localStorage.setItem('customer_token', res.data.access_token);
      localStorage.setItem('customer_name', res.data.customer.name);
      setCustomer(res.data.customer);
      setView('home');
    } catch (e: any) { setError(e.response?.data?.message || 'Authentication failed'); }
    finally { setLoading(false); }
  };

  const loadVehicles = async () => {
    try { const r = await portalApi.vehicles(); setVehicles(r.data); } catch { /* ignore */ }
    setView('book');
  };

  const loadBookings = async () => {
    try { const r = await portalApi.bookings(); setBookings(r.data?.data || r.data || []); } catch { /* ignore */ }
    setView('bookings');
  };

  const handleBook = async () => {
    if (!bookForm.origin || !bookForm.destination) { setError('Origin and destination required'); return; }
    setLoading(true); setError('');
    try {
      const res = await portalApi.book({ ...bookForm, weightMT: bookForm.weightMT ? parseFloat(bookForm.weightMT) : undefined });
      alert(`Booking created! Tracking #: ${res.data.trackingNumber}`);
      setBookForm({ origin: '', destination: '', cargoDescription: '', weightMT: '', vehicleId: '', scheduledPickup: '' });
      setView('home');
    } catch (e: any) { setError(e.response?.data?.message || 'Booking failed'); }
    finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_name');
    setCustomer(null); setView('login');
  };

  const input: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
  const btn: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #1a6dcc, #0d4a8a)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,109,204,0.25)' };

  // Auth screens
  if (view === 'login' || view === 'signup') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--bg-secondary), #e8f0fb)' }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 20, padding: '36px 32px', width: 380, boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #1a6dcc, #0d4a8a)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>FT</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>FreightTrack</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Customer Portal</div>
          </div>

          {view === 'signup' && (
            <>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" style={{ ...input, marginBottom: 10 }} />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" style={{ ...input, marginBottom: 10 }} />
            </>
          )}
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" style={{ ...input, marginBottom: 10 }} />
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Password" onKeyDown={e => e.key === 'Enter' && handleAuth(view === 'signup')} style={{ ...input, marginBottom: 14 }} />

          {error && <div style={{ fontSize: 13, color: 'var(--red)', padding: '8px 12px', background: 'var(--red-light)', borderRadius: 8, marginBottom: 10 }}>{error}</div>}

          <button onClick={() => handleAuth(view === 'signup')} disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Please wait...' : view === 'signup' ? 'Create account' : 'Sign in'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
            {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
              {view === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Home
  if (view === 'home') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
        <div style={{ background: 'var(--bg-primary)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1a6dcc, #0d4a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>FT</div>
            <span style={{ fontSize: 15, fontWeight: 600 }}>FreightTrack</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Hi, {customer?.name}</span>
            <button onClick={logout} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
        <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>What would you like to do?</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Book a shipment', desc: 'Create a new freight booking', action: loadVehicles, color: 'var(--accent)' },
              { label: 'My bookings', desc: 'View your booking history and status', action: loadBookings, color: 'var(--green)' },
              { label: 'Track shipment', desc: 'Track using tracking number', action: () => navigate('/track/'), color: 'var(--orange)' },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-primary)', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Book
  if (view === 'book') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: 24 }}>
        <button onClick={() => setView('home')} style={{ marginBottom: 16, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Back</button>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'var(--bg-primary)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>New Booking</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Origin *</label><input value={bookForm.origin} onChange={e => setBookForm(f => ({ ...f, origin: e.target.value }))} placeholder="Pickup location" style={input} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Destination *</label><input value={bookForm.destination} onChange={e => setBookForm(f => ({ ...f, destination: e.target.value }))} placeholder="Delivery location" style={input} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Cargo Description</label><input value={bookForm.cargoDescription} onChange={e => setBookForm(f => ({ ...f, cargoDescription: e.target.value }))} placeholder="What are you shipping?" style={input} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Weight (MT)</label><input type="number" value={bookForm.weightMT} onChange={e => setBookForm(f => ({ ...f, weightMT: e.target.value }))} style={input} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Pickup Date</label><input type="date" value={bookForm.scheduledPickup} onChange={e => setBookForm(f => ({ ...f, scheduledPickup: e.target.value }))} style={input} /></div>
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Preferred Vehicle</label>
              <select value={bookForm.vehicleId} onChange={e => setBookForm(f => ({ ...f, vehicleId: e.target.value }))} style={input}>
                <option value="">Any available</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber} — {v.type} ({v.capacityMT}MT)</option>)}
              </select>
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--red)', padding: '8px 12px', background: 'var(--red-light)', borderRadius: 8 }}>{error}</div>}
            <button onClick={handleBook} disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1 }}>{loading ? 'Submitting...' : 'Submit Booking'}</button>
          </div>
        </div>
      </div>
    );
  }

  // Bookings
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: 24 }}>
      <button onClick={() => setView('home')} style={{ marginBottom: 16, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Back</button>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>My Bookings</div>
        {bookings.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 14 }}>No bookings yet</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookings.map((b: any) => {
              const sc = STATUS_COLORS[b.status] || STATUS_COLORS.INQUIRY;
              return (
                <div key={b.id} style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: '16px 18px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{b.trackingNumber}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6, background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{b.origin} → {b.destination}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {b.cargoDescription} {b.weightMT ? `· ${b.weightMT}MT` : ''} · {new Date(b.createdAt).toLocaleDateString('en-IN')}
                  </div>
                  {b.trackingNumber && (
                    <button onClick={() => navigate(`/track/${b.trackingNumber}`)} style={{ marginTop: 8, padding: '5px 12px', borderRadius: 6, fontSize: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>Track</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

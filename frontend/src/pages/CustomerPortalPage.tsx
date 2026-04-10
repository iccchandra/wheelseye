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

const STATUS_BADGE: Record<string, string> = {
  INQUIRY:    'badge-purple',
  BOOKED:     'badge-blue',
  DISPATCHED: 'badge-orange',
  IN_TRANSIT: 'badge-green',
  DELIVERED:  'badge-blue',
  DELAYED:    'badge-red',
  CANCELLED:  'badge-gray',
};

const STATUS_LABEL: Record<string, string> = {
  INQUIRY: 'Inquiry', BOOKED: 'Booked', DISPATCHED: 'Dispatched',
  IN_TRANSIT: 'In Transit', DELIVERED: 'Delivered', DELAYED: 'Delayed', CANCELLED: 'Cancelled',
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

  // Auth screens
  if (view === 'login' || view === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white rounded-2xl px-8 py-9 w-[380px] shadow-card-hover animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 inline-flex items-center justify-center text-white text-lg font-bold mb-2.5">FT</div>
            <div className="text-lg font-semibold text-slate-800">FreightTrack</div>
            <div className="text-sm text-slate-400">Customer Portal</div>
          </div>

          {view === 'signup' && (
            <>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="input mb-2.5" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="input mb-2.5" />
            </>
          )}
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="input mb-2.5" />
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Password" onKeyDown={e => e.key === 'Enter' && handleAuth(view === 'signup')} className="input mb-3.5" />

          {error && <div className="text-sm text-red-500 px-3 py-2 bg-red-50 rounded-lg mb-2.5">{error}</div>}

          <button onClick={() => handleAuth(view === 'signup')} disabled={loading} className="btn-primary w-full shadow-btn-primary">
            {loading ? 'Please wait...' : view === 'signup' ? 'Create account' : 'Sign in'}
          </button>

          <div className="text-center mt-3.5 text-sm text-slate-500">
            {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); }} className="bg-transparent border-none text-brand-600 font-medium cursor-pointer text-sm hover:underline">
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
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white px-6 py-3.5 flex justify-between items-center border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white text-xs font-bold">FT</div>
            <span className="text-[15px] font-semibold text-slate-800">FreightTrack</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-slate-500">Hi, {customer?.name}</span>
            <button onClick={logout} className="btn-secondary btn-sm">Logout</button>
          </div>
        </div>
        <div className="max-w-[600px] mx-auto mt-10 px-5">
          <div className="text-[22px] font-semibold text-slate-800 mb-6">What would you like to do?</div>
          <div className="grid gap-3">
            {[
              { label: 'Book a shipment', desc: 'Create a new freight booking', action: loadVehicles, dotColor: 'bg-brand-500' },
              { label: 'My bookings', desc: 'View your booking history and status', action: loadBookings, dotColor: 'bg-emerald-500' },
              { label: 'Track shipment', desc: 'Track using tracking number', action: () => navigate('/track/'), dotColor: 'bg-amber-500' },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="card flex items-center gap-3.5 px-5 py-4.5 text-left cursor-pointer hover:shadow-card-hover transition-shadow">
                <div className="w-11 h-11 rounded-[10px] bg-slate-50 flex items-center justify-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-slate-800">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
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
      <div className="min-h-screen bg-slate-50 p-6">
        <button onClick={() => setView('home')} className="btn-secondary btn-sm mb-4">Back</button>
        <div className="max-w-[600px] mx-auto card p-6">
          <div className="text-lg font-semibold text-slate-800 mb-5">New Booking</div>
          <div className="grid gap-3">
            <div><label className="form-label">Origin *</label><input value={bookForm.origin} onChange={e => setBookForm(f => ({ ...f, origin: e.target.value }))} placeholder="Pickup location" className="input" /></div>
            <div><label className="form-label">Destination *</label><input value={bookForm.destination} onChange={e => setBookForm(f => ({ ...f, destination: e.target.value }))} placeholder="Delivery location" className="input" /></div>
            <div><label className="form-label">Cargo Description</label><input value={bookForm.cargoDescription} onChange={e => setBookForm(f => ({ ...f, cargoDescription: e.target.value }))} placeholder="What are you shipping?" className="input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Weight (MT)</label><input type="number" value={bookForm.weightMT} onChange={e => setBookForm(f => ({ ...f, weightMT: e.target.value }))} className="input" /></div>
              <div><label className="form-label">Pickup Date</label><input type="date" value={bookForm.scheduledPickup} onChange={e => setBookForm(f => ({ ...f, scheduledPickup: e.target.value }))} className="input" /></div>
            </div>
            <div><label className="form-label">Preferred Vehicle</label>
              <select value={bookForm.vehicleId} onChange={e => setBookForm(f => ({ ...f, vehicleId: e.target.value }))} className="select">
                <option value="">Any available</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.regNumber} — {v.type} ({v.capacityMT}MT)</option>)}
              </select>
            </div>
            {error && <div className="text-sm text-red-500 px-3 py-2 bg-red-50 rounded-lg">{error}</div>}
            <button onClick={handleBook} disabled={loading} className="btn-primary w-full">{loading ? 'Submitting...' : 'Submit Booking'}</button>
          </div>
        </div>
      </div>
    );
  }

  // Bookings
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <button onClick={() => setView('home')} className="btn-secondary btn-sm mb-4">Back</button>
      <div className="max-w-[700px] mx-auto">
        <div className="text-lg font-semibold text-slate-800 mb-4">My Bookings</div>
        {bookings.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">No bookings yet</div> : (
          <div className="flex flex-col gap-2.5">
            {bookings.map((b: any) => {
              const badgeCls = STATUS_BADGE[b.status] || 'badge-gray';
              const label = STATUS_LABEL[b.status] || b.status;
              return (
                <div key={b.id} className="card px-4.5 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-800">{b.trackingNumber}</span>
                    <span className={badgeCls}>{label}</span>
                  </div>
                  <div className="text-sm text-slate-500 mb-1">{b.origin} → {b.destination}</div>
                  <div className="text-xs text-slate-400">
                    {b.cargoDescription} {b.weightMT ? `· ${b.weightMT}MT` : ''} · {new Date(b.createdAt).toLocaleDateString('en-IN')}
                  </div>
                  {b.trackingNumber && (
                    <button onClick={() => navigate(`/track/${b.trackingNumber}`)} className="btn-secondary btn-sm mt-2 text-brand-600">Track</button>
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

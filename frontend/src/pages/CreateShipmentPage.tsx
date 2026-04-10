import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { shipmentApi, vehicleApi, driverApi } from '../services/api';

const TRUCK_TYPES = ['OPEN', 'CONTAINER', 'TRAILER', 'FLATBED', 'MINI', 'REFRIGERATED'];

export const CreateShipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    origin: '', originLat: '', originLng: '',
    destination: '', destinationLat: '', destinationLng: '',
    cargoDescription: '', weightMT: '', truckType: 'CONTAINER',
    scheduledPickup: '', estimatedDelivery: '',
    quotedAmount: '', insuranceEnabled: false, insuranceCoverage: '',
    consigneeName: '', consigneePhone: '', shipperPhone: '',
    vehicleId: '', driverId: '', internalNotes: '',
  });
  const [error, setError] = useState('');

  const { data: vehiclesData } = useQuery('vehicles-available', vehicleApi.getAvailable);
  const { data: driversData  } = useQuery('drivers-available',  driverApi.getAvailable);
  const vehicles = vehiclesData?.data || [];
  const drivers  = driversData?.data  || [];

  const mutation = useMutation(
    (data: any) => shipmentApi.create(data),
    {
      onSuccess: (res) => navigate(`/shipments`),
      onError:   (err: any) => setError(err?.response?.data?.message || 'Failed to create shipment'),
    }
  );

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    if (!form.origin || !form.destination || !form.cargoDescription || !form.weightMT) {
      setError('Origin, destination, cargo description and weight are required'); return;
    }
    setError('');
    mutation.mutate({
      ...form,
      weightMT:         parseFloat(form.weightMT),
      quotedAmount:     form.quotedAmount ? parseFloat(form.quotedAmount) : undefined,
      insuranceCoverage:form.insuranceCoverage ? parseFloat(form.insuranceCoverage) : undefined,
      originLat:        form.originLat ? parseFloat(form.originLat) : undefined,
      originLng:        form.originLng ? parseFloat(form.originLng) : undefined,
      destinationLat:   form.destinationLat ? parseFloat(form.destinationLat) : undefined,
      destinationLng:   form.destinationLng ? parseFloat(form.destinationLng) : undefined,
      vehicleId:        form.vehicleId || undefined,
      driverId:         form.driverId  || undefined,
    });
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
  const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };
  const sectionStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '20px 0 10px' };

  return (
    <div style={{ padding: '20px 24px', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/shipments')} style={{ background: 'none', border: '0.5px solid var(--border)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>← Back</button>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>New shipment</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <div style={{ gridColumn: '1/-1' }}><div style={sectionStyle}>Route</div></div>

        <div>
          <label style={labelStyle}>Origin city *</label>
          <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="e.g. Hyderabad" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Destination city *</label>
          <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Delhi" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Origin lat, lng</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={form.originLat} onChange={e => set('originLat', e.target.value)} placeholder="Lat" style={{ ...inputStyle, width: '50%' }} />
            <input value={form.originLng} onChange={e => set('originLng', e.target.value)} placeholder="Lng" style={{ ...inputStyle, width: '50%' }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Destination lat, lng</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={form.destinationLat} onChange={e => set('destinationLat', e.target.value)} placeholder="Lat" style={{ ...inputStyle, width: '50%' }} />
            <input value={form.destinationLng} onChange={e => set('destinationLng', e.target.value)} placeholder="Lng" style={{ ...inputStyle, width: '50%' }} />
          </div>
        </div>

        <div style={{ gridColumn: '1/-1' }}><div style={sectionStyle}>Cargo</div></div>

        <div>
          <label style={labelStyle}>Cargo description *</label>
          <input value={form.cargoDescription} onChange={e => set('cargoDescription', e.target.value)} placeholder="e.g. Electronics, FMCG" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Truck type</label>
          <select value={form.truckType} onChange={e => set('truckType', e.target.value)} style={inputStyle}>
            {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Weight (MT) *</label>
          <input type="number" value={form.weightMT} onChange={e => set('weightMT', e.target.value)} placeholder="e.g. 12" min="0.1" step="0.1" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Freight amount (₹)</label>
          <input type="number" value={form.quotedAmount} onChange={e => set('quotedAmount', e.target.value)} placeholder="e.g. 48000" style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1/-1' }}><div style={sectionStyle}>Schedule</div></div>

        <div>
          <label style={labelStyle}>Pickup date &amp; time</label>
          <input type="datetime-local" value={form.scheduledPickup} onChange={e => set('scheduledPickup', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Estimated delivery</label>
          <input type="datetime-local" value={form.estimatedDelivery} onChange={e => set('estimatedDelivery', e.target.value)} style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1/-1' }}><div style={sectionStyle}>Assign vehicle &amp; driver</div></div>

        <div>
          <label style={labelStyle}>Vehicle</label>
          <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} style={inputStyle}>
            <option value="">— Select vehicle —</option>
            {vehicles.map((v: any) => (
              <option key={v.id} value={v.id}>{v.regNumber} · {v.type} · {v.capacityMT}MT</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Driver</label>
          <select value={form.driverId} onChange={e => set('driverId', e.target.value)} style={inputStyle}>
            <option value="">— Select driver —</option>
            {drivers.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name} · {d.phone}</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: '1/-1' }}><div style={sectionStyle}>Consignee &amp; insurance</div></div>

        <div>
          <label style={labelStyle}>Consignee name</label>
          <input value={form.consigneeName} onChange={e => set('consigneeName', e.target.value)} placeholder="Recipient name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Consignee phone</label>
          <input value={form.consigneePhone} onChange={e => set('consigneePhone', e.target.value)} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Shipper phone</label>
          <input value={form.shipperPhone} onChange={e => set('shipperPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
          <input type="checkbox" id="insurance" checked={form.insuranceEnabled} onChange={e => set('insuranceEnabled', e.target.checked)} />
          <label htmlFor="insurance" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>Enable trip insurance</label>
          {form.insuranceEnabled && (
            <input type="number" value={form.insuranceCoverage} onChange={e => set('insuranceCoverage', e.target.value)} placeholder="Coverage ₹" style={{ ...inputStyle, width: 140 }} />
          )}
        </div>

        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Internal notes</label>
          <textarea value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} rows={2} placeholder="Any special handling instructions..." style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {error && <div style={{ gridColumn: '1/-1', fontSize: 13, color: '#A32D2D', padding: '8px 12px', background: '#FCEBEB', borderRadius: 7 }}>{error}</div>}

        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleSubmit} disabled={mutation.isLoading} style={{ flex: 1, padding: '10px', borderRadius: 7, background: '#185FA5', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: mutation.isLoading ? 'not-allowed' : 'pointer', opacity: mutation.isLoading ? 0.7 : 1 }}>
            {mutation.isLoading ? 'Creating...' : 'Create shipment'}
          </button>
          <button onClick={() => navigate('/shipments')} style={{ padding: '10px 20px', borderRadius: 7, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

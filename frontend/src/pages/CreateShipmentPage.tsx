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

  return (
    <div className="page max-w-[720px]">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/shipments')} className="btn-secondary btn-sm">← Back</button>
          <h1 className="page-title">New shipment</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="col-span-full"><div className="form-section-title !border-0 !p-0 !mb-0 mt-1">Route</div></div>

        <div>
          <label className="form-label">Origin city *</label>
          <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="e.g. Hyderabad" className="input" />
        </div>
        <div>
          <label className="form-label">Destination city *</label>
          <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Delhi" className="input" />
        </div>
        <div>
          <label className="form-label">Origin lat, lng</label>
          <div className="flex gap-1.5">
            <input value={form.originLat} onChange={e => set('originLat', e.target.value)} placeholder="Lat" className="input w-1/2" />
            <input value={form.originLng} onChange={e => set('originLng', e.target.value)} placeholder="Lng" className="input w-1/2" />
          </div>
        </div>
        <div>
          <label className="form-label">Destination lat, lng</label>
          <div className="flex gap-1.5">
            <input value={form.destinationLat} onChange={e => set('destinationLat', e.target.value)} placeholder="Lat" className="input w-1/2" />
            <input value={form.destinationLng} onChange={e => set('destinationLng', e.target.value)} placeholder="Lng" className="input w-1/2" />
          </div>
        </div>

        <div className="col-span-full"><div className="form-section-title !border-0 !p-0 !mb-0 mt-1">Cargo</div></div>

        <div>
          <label className="form-label">Cargo description *</label>
          <input value={form.cargoDescription} onChange={e => set('cargoDescription', e.target.value)} placeholder="e.g. Electronics, FMCG" className="input" />
        </div>
        <div>
          <label className="form-label">Truck type</label>
          <select value={form.truckType} onChange={e => set('truckType', e.target.value)} className="select">
            {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Weight (MT) *</label>
          <input type="number" value={form.weightMT} onChange={e => set('weightMT', e.target.value)} placeholder="e.g. 12" min="0.1" step="0.1" className="input" />
        </div>
        <div>
          <label className="form-label">Freight amount (&#8377;)</label>
          <input type="number" value={form.quotedAmount} onChange={e => set('quotedAmount', e.target.value)} placeholder="e.g. 48000" className="input" />
        </div>

        <div className="col-span-full"><div className="form-section-title !border-0 !p-0 !mb-0 mt-1">Schedule</div></div>

        <div>
          <label className="form-label">Pickup date &amp; time</label>
          <input type="datetime-local" value={form.scheduledPickup} onChange={e => set('scheduledPickup', e.target.value)} className="input" />
        </div>
        <div>
          <label className="form-label">Estimated delivery</label>
          <input type="datetime-local" value={form.estimatedDelivery} onChange={e => set('estimatedDelivery', e.target.value)} className="input" />
        </div>

        <div className="col-span-full"><div className="form-section-title !border-0 !p-0 !mb-0 mt-1">Assign vehicle &amp; driver</div></div>

        <div>
          <label className="form-label">Vehicle</label>
          <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} className="select">
            <option value="">— Select vehicle —</option>
            {vehicles.map((v: any) => (
              <option key={v.id} value={v.id}>{v.regNumber} · {v.type} · {v.capacityMT}MT</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Driver</label>
          <select value={form.driverId} onChange={e => set('driverId', e.target.value)} className="select">
            <option value="">— Select driver —</option>
            {drivers.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name} · {d.phone}</option>
            ))}
          </select>
        </div>

        <div className="col-span-full"><div className="form-section-title !border-0 !p-0 !mb-0 mt-1">Consignee &amp; insurance</div></div>

        <div>
          <label className="form-label">Consignee name</label>
          <input value={form.consigneeName} onChange={e => set('consigneeName', e.target.value)} placeholder="Recipient name" className="input" />
        </div>
        <div>
          <label className="form-label">Consignee phone</label>
          <input value={form.consigneePhone} onChange={e => set('consigneePhone', e.target.value)} placeholder="+91 XXXXX XXXXX" className="input" />
        </div>
        <div>
          <label className="form-label">Shipper phone</label>
          <input value={form.shipperPhone} onChange={e => set('shipperPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" className="input" />
        </div>
        <div className="flex items-center gap-2.5 pt-5">
          <input type="checkbox" id="insurance" checked={form.insuranceEnabled} onChange={e => set('insuranceEnabled', e.target.checked)} className="accent-brand-600" />
          <label htmlFor="insurance" className="text-sm text-slate-800 cursor-pointer">Enable trip insurance</label>
          {form.insuranceEnabled && (
            <input type="number" value={form.insuranceCoverage} onChange={e => set('insuranceCoverage', e.target.value)} placeholder="Coverage &#8377;" className="input w-36" />
          )}
        </div>

        <div className="col-span-full">
          <label className="form-label">Internal notes</label>
          <textarea value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} rows={2} placeholder="Any special handling instructions..." className="input resize-y" />
        </div>

        {error && <div className="col-span-full text-sm text-red-700 px-3 py-2 bg-red-50 rounded-lg">{error}</div>}

        <div className="col-span-full flex gap-2 mt-2">
          <button onClick={handleSubmit} disabled={mutation.isLoading} className="btn-primary flex-1">
            {mutation.isLoading ? 'Creating...' : 'Create shipment'}
          </button>
          <button onClick={() => navigate('/shipments')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

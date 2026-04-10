import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp:   (phone: string)               => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string)  => api.post('/auth/verify-otp', { phone, otp }),
  me:        ()                             => api.get('/auth/me'),
};

// ─── Shipments ────────────────────────────────────────────────────────────────
export const shipmentApi = {
  getAll:           (params?: any)                              => api.get('/shipments', { params }),
  getOne:           (id: string)                                => api.get(`/shipments/${id}`),
  getByTracking:    (tn: string)                                => api.get(`/shipments/track/${tn}`),
  create:           (data: any)                                 => api.post('/shipments', data),
  update:           (id: string, data: any)                     => api.put(`/shipments/${id}`, data),
  updateStatus:     (id: string, status: string)                => api.patch(`/shipments/${id}/status`, { status }),
  assign:           (id: string, vehicleId: string, driverId: string) => api.patch(`/shipments/${id}/assign`, { vehicleId, driverId }),
  uploadPOD:        (id: string, data: any)                     => api.patch(`/shipments/${id}/pod`, data),
  getDashboardStats: ()                                         => api.get('/shipments/stats/dashboard'),
};

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const vehicleApi = {
  getAll:       (params?: any)           => api.get('/vehicles', { params }),
  getOne:       (id: string)             => api.get(`/vehicles/${id}`),
  getAvailable: ()                       => api.get('/vehicles/available'),
  getExpiring:  (days = 30)             => api.get(`/vehicles/expiring?days=${days}`),
  create:       (data: any)              => api.post('/vehicles', data),
  update:       (id: string, data: any)  => api.put(`/vehicles/${id}`, data),
};

// ─── Drivers ──────────────────────────────────────────────────────────────────
export const driverApi = {
  getAll:       (params?: any)           => api.get('/drivers', { params }),
  getOne:       (id: string)             => api.get(`/drivers/${id}`),
  getAvailable: ()                       => api.get('/drivers/available'),
  create:       (data: any)              => api.post('/drivers', data),
  update:       (id: string, data: any)  => api.put(`/drivers/${id}`, data),
};

// ─── GPS ──────────────────────────────────────────────────────────────────────
export const gpsApi = {
  getLatestPosition: (vehicleId: string)                        => api.get(`/gps/position/${vehicleId}`),
  getRouteHistory:   (shipmentId: string, from?: string, to?: string) => api.get(`/gps/history/${shipmentId}`, { params: { from, to } }),
  getGeofences:      ()                                         => api.get('/gps/geofences'),
  createGeofence:    (data: any)                                => api.post('/gps/geofences', data),
  deleteGeofence:    (id: string)                               => api.delete(`/gps/geofences/${id}`),
  getStops:          (vehicleId: string, date?: string)         => api.get(`/gps/stops/${vehicleId}`, { params: { date } }),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertApi = {
  getAll:       (params?: any)              => api.get('/alerts', { params }),
  getUnread:    ()                          => api.get('/alerts/unread'),
  acknowledge:  (id: string)               => api.patch(`/alerts/${id}/acknowledge`),
};

// ─── Billing ──────────────────────────────────────────────────────────────────
export const billingApi = {
  getInvoices:        (params?: any)                 => api.get('/billing/invoices', { params }),
  getOne:             (id: string)                   => api.get(`/billing/invoices/${id}`),
  create:             (shipmentId: string, extras?: any) => api.post('/billing/invoices', { shipmentId, ...extras }),
  createPaymentOrder: (id: string)                   => api.post(`/billing/invoices/${id}/payment`),
  verifyPayment:      (id: string, razorpayPaymentId: string) => api.post(`/billing/invoices/${id}/verify`, { razorpayPaymentId }),
};

// ─── Documents (PDF download) ─────────────────────────────────────────────────
export const documentApi = {
  downloadLR:      (shipmentId: string) => api.get(`/documents/lr/${shipmentId}`, { responseType: 'blob' }),
  downloadPOD:     (shipmentId: string) => api.get(`/documents/pod/${shipmentId}`, { responseType: 'blob' }),
  downloadInvoice: (invoiceId: string)  => api.get(`/documents/invoice/${invoiceId}`, { responseType: 'blob' }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  getOTDR:           (params?: any) => api.get('/reports/otdr', { params }),
  getLanePerformance:(params?: any) => api.get('/reports/lanes', { params }),
  getCarrierScorecard:(params?: any)=> api.get('/reports/carriers', { params }),
  getDashboard:       ()            => api.get('/reports/dashboard'),
  getFuelReport:     (params?: any) => api.get('/reports/fuel', { params }),
  getTripReport:     (params?: any) => api.get('/reports/trips', { params }),
  getIEChart:        (days?: number)=> api.get('/reports/ie-chart', { params: { days } }),
  getVehicleLocations:()            => api.get('/reports/vehicle-locations'),
  getGeofenceEvents: (limit?: number)=> api.get('/reports/geofence-events', { params: { limit } }),
  exportExcel:       (params?: any) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
};

// ─── Fuel ─────────────────────────────────────────────────────────────────────
export const fuelApi = {
  getAll:    (params?: any) => api.get('/fuel', { params }),
  getOne:    (id: string) => api.get(`/fuel/${id}`),
  create:    (data: any) => api.post('/fuel', data),
  update:    (id: string, data: any) => api.put(`/fuel/${id}`, data),
  remove:    (id: string) => api.delete(`/fuel/${id}`),
  getReport: (params?: any) => api.get('/fuel/report', { params }),
};

// ─── Income & Expense ─────────────────────────────────────────────────────────
export const incomeExpenseApi = {
  getAll:    (params?: any) => api.get('/income-expense', { params }),
  getOne:    (id: string) => api.get(`/income-expense/${id}`),
  create:    (data: any) => api.post('/income-expense', data),
  update:    (id: string, data: any) => api.put(`/income-expense/${id}`, data),
  remove:    (id: string) => api.delete(`/income-expense/${id}`),
  getReport: (params?: any) => api.get('/income-expense/report', { params }),
};

// ─── Reminders ────────────────────────────────────────────────────────────────
export const reminderApi = {
  getAll:     (params?: any) => api.get('/reminders', { params }),
  getToday:   () => api.get('/reminders/today'),
  getUpcoming:() => api.get('/reminders/upcoming'),
  create:     (data: any) => api.post('/reminders', data),
  markAsRead: (id: string) => api.patch(`/reminders/${id}/read`),
  remove:     (id: string) => api.delete(`/reminders/${id}`),
};

// ─── Customers ────────────────────────────────────────────────────────────────
export const customerApi = {
  getAll:  (params?: any) => api.get('/customers', { params }),
  getOne:  (id: string) => api.get(`/customers/${id}`),
  create:  (data: any) => api.post('/customers', data),
  update:  (id: string, data: any) => api.put(`/customers/${id}`, data),
  remove:  (id: string) => api.delete(`/customers/${id}`),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  getAll:           () => api.get('/settings'),
  getByGroup:       (group: string) => api.get(`/settings/group/${group}`),
  set:              (data: { key: string; value: string; group?: string }) => api.post('/settings', data),
  bulkSet:          (settings: any[]) => api.post('/settings/bulk', { settings }),
  getTemplates:     () => api.get('/settings/templates'),
  getTemplate:      (id: string) => api.get(`/settings/templates/${id}`),
  createTemplate:   (data: any) => api.post('/settings/templates', data),
  updateTemplate:   (id: string, data: any) => api.put(`/settings/templates/${id}`, data),
};

// ─── Vehicle Groups ───────────────────────────────────────────────────────────
export const vehicleGroupApi = {
  getAll:  () => api.get('/vehicle-groups'),
  create:  (data: any) => api.post('/vehicle-groups', data),
  update:  (id: string, data: any) => api.put(`/vehicle-groups/${id}`, data),
  remove:  (id: string) => api.delete(`/vehicle-groups/${id}`),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const userApi = {
  getAll:  (params?: any) => api.get('/users', { params }),
  getOne:  (id: string) => api.get(`/users/${id}`),
  create:  (data: any) => api.post('/users', data),
  update:  (id: string, data: any) => api.put(`/users/${id}`, data),
  remove:  (id: string) => api.delete(`/users/${id}`),
};

// ─── Shipment Payments ────────────────────────────────────────────────────────
export const shipmentPaymentApi = {
  create:         (data: any) => api.post('/shipment-payments', data),
  getByShipment:  (shipmentId: string) => api.get(`/shipment-payments/shipment/${shipmentId}`),
  remove:         (id: string) => api.delete(`/shipment-payments/${id}`),
};

// ─── Uploads ──────────────────────────────────────────────────────────────────
export const uploadApi = {
  upload: (file: File, category?: string) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(category ? `/uploads/${category}` : '/uploads/single', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return api.post('/uploads/multiple', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;

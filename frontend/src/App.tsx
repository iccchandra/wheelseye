import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { LoginPage }          from './pages/LoginPage';
import { DashboardPage }      from './pages/DashboardPage';
import { ShipmentsPage }      from './pages/ShipmentsPage';
import { CreateShipmentPage } from './pages/CreateShipmentPage';
import { AlertsPage }         from './pages/AlertsPage';
import { RouteHistoryPage }   from './pages/RouteHistoryPage';
import { VehiclesPage }       from './pages/VehiclesPage';
import { DriversPage }        from './pages/DriversPage';
import { BillingPage }        from './pages/BillingPage';
import { ReportsPage }        from './pages/ReportsPage';
import { PublicTrackingPage } from './pages/PublicTrackingPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { FuelPage }          from './pages/FuelPage';
import { IncomeExpensePage } from './pages/IncomeExpensePage';
import { RemindersPage }     from './pages/RemindersPage';
import { CustomersPage }     from './pages/CustomersPage';
import { SettingsPage }      from './pages/SettingsPage';
import { UsersPage }         from './pages/UsersPage';
import { StopsPage }         from './pages/StopsPage';
import { GeofencePage }      from './pages/GeofencePage';
import { ShipmentDetailPage } from './pages/ShipmentDetailPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false } },
});

const NAV_SECTIONS = [
  { label: 'MAIN', items: [
    { to: '/dashboard', label: 'Live Map',    icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z' },
    { to: '/shipments', label: 'Shipments',   icon: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM20 9.5l2.46 3H17V9.5h3zm-2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' },
    { to: '/alerts',    label: 'Alerts',      icon: 'M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
  ]},
  { label: 'FLEET', items: [
    { to: '/vehicles',  label: 'Vehicles',    icon: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z' },
    { to: '/drivers',   label: 'Drivers',     icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { to: '/fuel',      label: 'Fuel',        icon: 'M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 002.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 005 0V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z' },
    { to: '/stops',     label: 'Stops',       icon: 'M12 2C8.13 2 5 5.13 5 9c0 4.17 4.42 9.92 6.24 12.11.4.48 1.13.48 1.52 0C14.58 18.92 19 13.17 19 9c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z' },
    { to: '/geofence',  label: 'Geofence',    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
  ]},
  { label: 'BUSINESS', items: [
    { to: '/customers', label: 'Customers',   icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { to: '/billing',   label: 'Billing',     icon: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' },
    { to: '/income-expense', label: 'Finance', icon: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z' },
    { to: '/reports',   label: 'Reports',     icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
  ]},
  { label: 'SYSTEM', items: [
    { to: '/reminders', label: 'Reminders',   icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z' },
    { to: '/settings',  label: 'Settings',    icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 118.4 12 3.6 3.6 0 0112 15.6z' },
    { to: '/users',     label: 'Users',       icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z' },
  ]},
];

const isLoggedIn = () => !!localStorage.getItem('access_token');

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;

const SvgIcon: React.FC<{ d: string; size?: number }> = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
);

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <nav style={{
        width: 220, flexShrink: 0,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.12)', zIndex: 10, overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 800,
            boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
          }}>FT</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>FreightTrack</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '1px' }}>FLEET OPS</div>
          </div>
        </div>

        {/* Nav sections */}
        <div style={{ flex: 1, padding: '4px 0' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div style={{ padding: '16px 18px 6px', fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                {section.label}
              </div>
              {section.items.map(n => {
                const active = location.pathname === n.to || location.pathname.startsWith(n.to + '/');
                return (
                  <NavLink key={n.to} to={n.to} style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '9px 14px', margin: '2px 10px', borderRadius: 10,
                    fontSize: 13, fontWeight: active ? 600 : 400, textDecoration: 'none',
                    color: active ? '#ffffff' : '#94a3b8',
                    background: active ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.15))' : 'transparent',
                    borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'all 0.2s ease',
                  }}>
                    <SvgIcon d={n.icon} size={18} />
                    {n.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => { localStorage.removeItem('access_token'); window.location.href = '/login'; }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: 'rgba(239,68,68,0.08)', color: '#f87171',
              border: 'none',
            }}
          >
            <SvgIcon d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" size={18} />
            Logout
          </button>
        </div>
      </nav>
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-secondary)' }}>{children}</main>
    </div>
  );
};

export const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"                        element={<LoginPage />} />
        <Route path="/track/:trackingNumber"        element={<PublicTrackingPage />} />
        <Route path="/portal/*"                     element={<CustomerPortalPage />} />

        {/* Protected */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/"                                  element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"                         element={<DashboardPage />} />
                <Route path="/shipments"                         element={<ShipmentsPage />} />
                <Route path="/shipments/new"                     element={<CreateShipmentPage />} />
                <Route path="/shipments/:id/details"             element={<ShipmentDetailPage />} />
                <Route path="/shipments/:shipmentId/history"     element={<RouteHistoryPage />} />
                <Route path="/alerts"                            element={<AlertsPage />} />
                <Route path="/vehicles"                          element={<VehiclesPage />} />
                <Route path="/drivers"                           element={<DriversPage />} />
                <Route path="/billing"                           element={<BillingPage />} />
                <Route path="/reports"                           element={<ReportsPage />} />
                <Route path="/fuel"                              element={<FuelPage />} />
                <Route path="/income-expense"                    element={<IncomeExpensePage />} />
                <Route path="/reminders"                         element={<RemindersPage />} />
                <Route path="/customers"                         element={<CustomersPage />} />
                <Route path="/settings"                          element={<SettingsPage />} />
                <Route path="/users"                             element={<UsersPage />} />
                <Route path="/stops"                             element={<StopsPage />} />
                <Route path="/geofence"                          element={<GeofencePage />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  MapPin, Package, Bell, Truck, Users, Fuel, Receipt, BarChart3,
  Settings, Shield, Clock, UserCircle, Globe, DollarSign, MapPinned,
  ChevronRight, ChevronDown, LogOut, ScanLine,
} from 'lucide-react';
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
import { FuelPage }          from './pages/FuelPage';
import { IncomeExpensePage } from './pages/IncomeExpensePage';
import { RemindersPage }     from './pages/RemindersPage';
import { CustomersPage }     from './pages/CustomersPage';
import { SettingsPage }      from './pages/SettingsPage';
import { UsersPage }         from './pages/UsersPage';
import { StopsPage }         from './pages/StopsPage';
import { GeofencePage }      from './pages/GeofencePage';
import { AttendancePage }    from './pages/AttendancePage';
import { ShipmentDetailPage } from './pages/ShipmentDetailPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false } },
});

const NAV_SECTIONS = [
  { label: 'MAIN', color: 'blue', dot: 'bg-blue-600', items: [
    { to: '/dashboard', label: 'Live Map',    icon: MapPin },
    { to: '/shipments', label: 'Shipments',   icon: Package },
    { to: '/alerts',    label: 'Alerts',       icon: Bell },
  ]},
  { label: 'FLEET', color: 'emerald', dot: 'bg-emerald-600', items: [
    { to: '/vehicles',   label: 'Vehicles',    icon: Truck },
    { to: '/drivers',    label: 'Drivers',     icon: Users },
    { to: '/fuel',       label: 'Fuel',        icon: Fuel },
    { to: '/stops',      label: 'Tracking',    icon: MapPinned },
    { to: '/geofence',   label: 'Geofence',    icon: Globe },
    { to: '/attendance', label: 'Attendance',   icon: ScanLine },
  ]},
  { label: 'BUSINESS', color: 'violet', dot: 'bg-violet-600', items: [
    { to: '/customers', label: 'Customers',   icon: UserCircle },
    { to: '/billing',   label: 'Billing',     icon: Receipt },
    { to: '/income-expense', label: 'Finance', icon: DollarSign },
    { to: '/reports',   label: 'Reports',     icon: BarChart3 },
  ]},
  { label: 'SYSTEM', color: 'gray', dot: 'bg-gray-500', items: [
    { to: '/reminders', label: 'Reminders',   icon: Clock },
    { to: '/settings',  label: 'Settings',    icon: Settings },
    { to: '/users',     label: 'Users',       icon: Shield },
  ]},
];

const SECTION_ACTIVE_BG: Record<string, string> = {
  blue: 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700',
  emerald: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700',
  violet: 'bg-gradient-to-r from-violet-50 to-violet-100/50 text-violet-700',
  gray: 'bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-700',
};

const isLoggedIn = () => !!localStorage.getItem('access_token');

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ MAIN: true, FLEET: true, BUSINESS: true, SYSTEM: true });

  const toggleSection = (label: string) => setOpenSections(s => ({ ...s, [label]: !s[label] }));

  return (
    <div className="flex h-screen">
      {/* Sidebar — White, clean, with colored section accents */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
              <Truck className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900 leading-tight">FreightTrack</h2>
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest">FLEET OPS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={section.label}>
              {sIdx > 0 && <div className="my-2.5 border-t border-gray-100" />}
              <button onClick={() => toggleSection(section.label)}
                className="flex items-center justify-between w-full px-3 py-2 mb-0.5 rounded-lg transition-all hover:bg-gray-50 group">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${section.dot}`}>
                    <span className="text-[8px] text-white font-bold">{section.label[0]}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{section.label}</span>
                </div>
                <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${openSections[section.label] ? 'rotate-180' : ''}`} />
              </button>

              {openSections[section.label] && (
                <ul className="space-y-0.5 ml-1">
                  {section.items.map(n => {
                    const active = location.pathname === n.to || location.pathname.startsWith(n.to + '/');
                    const Icon = n.icon;
                    return (
                      <li key={n.to}>
                        <NavLink to={n.to} className={`
                          group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200
                          ${active
                            ? `${SECTION_ACTIVE_BG[section.color]} shadow-sm font-semibold`
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}>
                          <div className="flex items-center gap-3">
                            <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
                            <span className="text-sm font-medium">{n.label}</span>
                          </div>
                          <ChevronRight size={14} className={`text-gray-400 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                FT
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">Fleet Admin</p>
                <p className="text-[10px] text-gray-500">Operations Manager</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('access_token'); window.location.href = '/login'; }}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
          <div className="text-[10px] text-gray-400 mt-2 text-center">v2.0.0</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50/80">{children}</main>
    </div>
  );
};

export const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/track/:trackingNumber" element={<PublicTrackingPage />} />
        <Route path="/portal/*" element={<CustomerPortalPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/shipments" element={<ShipmentsPage />} />
                <Route path="/shipments/new" element={<CreateShipmentPage />} />
                <Route path="/shipments/:id/details" element={<ShipmentDetailPage />} />
                <Route path="/shipments/:shipmentId/history" element={<RouteHistoryPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/vehicles" element={<VehiclesPage />} />
                <Route path="/drivers" element={<DriversPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/fuel" element={<FuelPage />} />
                <Route path="/income-expense" element={<IncomeExpensePage />} />
                <Route path="/reminders" element={<RemindersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/stops" element={<StopsPage />} />
                <Route path="/geofence" element={<GeofencePage />} />
                <Route path="/attendance" element={<AttendancePage />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

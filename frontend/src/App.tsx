import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  MapPin, Package, Bell, Truck, Users, Fuel, Receipt, BarChart3,
  Settings, Shield, Clock, UserCircle, Globe, DollarSign, MapPinned,
  ChevronLeft, ChevronRight, LogOut, Search, Menu,
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
import { ShipmentDetailPage } from './pages/ShipmentDetailPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false } },
});

const NAV_SECTIONS = [
  { label: 'MAIN', items: [
    { to: '/dashboard', label: 'Live Map',    icon: MapPin },
    { to: '/shipments', label: 'Shipments',   icon: Package },
    { to: '/alerts',    label: 'Alerts',       icon: Bell },
  ]},
  { label: 'FLEET', items: [
    { to: '/vehicles',  label: 'Vehicles',    icon: Truck },
    { to: '/drivers',   label: 'Drivers',     icon: Users },
    { to: '/fuel',      label: 'Fuel',        icon: Fuel },
    { to: '/stops',     label: 'Stops',       icon: MapPinned },
    { to: '/geofence',  label: 'Geofence',    icon: Globe },
  ]},
  { label: 'BUSINESS', items: [
    { to: '/customers', label: 'Customers',   icon: UserCircle },
    { to: '/billing',   label: 'Billing',     icon: Receipt },
    { to: '/income-expense', label: 'Finance', icon: DollarSign },
    { to: '/reports',   label: 'Reports',     icon: BarChart3 },
  ]},
  { label: 'SYSTEM', items: [
    { to: '/reminders', label: 'Reminders',   icon: Clock },
    { to: '/settings',  label: 'Settings',    icon: Settings },
    { to: '/users',     label: 'Users',       icon: Shield },
  ]},
];

const isLoggedIn = () => !!localStorage.getItem('access_token');

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className={`${collapsed ? 'w-16' : 'w-56'} flex-shrink-0 bg-sidebar flex flex-col transition-all duration-300 ease-in-out z-20 shadow-lg`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-4 border-b border-sidebar-border`}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-sm font-extrabold shadow-glow flex-shrink-0">
            FT
          </div>
          {!collapsed && (
            <div className="ml-3 animate-fade-in">
              <div className="text-[14px] font-bold text-sidebar-text-active leading-tight">FreightTrack</div>
              <div className="text-[10px] font-semibold text-sidebar-section tracking-widest">FLEET OPS</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2">
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="mb-1">
              {!collapsed && (
                <div className="px-4 pt-4 pb-1 text-[10px] font-bold text-sidebar-section tracking-widest">
                  {section.label}
                </div>
              )}
              {section.items.map(n => {
                const active = location.pathname === n.to || location.pathname.startsWith(n.to + '/');
                const Icon = n.icon;
                return (
                  <NavLink key={n.to} to={n.to} title={n.label} className={`
                    flex items-center gap-3 mx-2 my-0.5 rounded-lg text-[13px] transition-all duration-150
                    ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'}
                    ${active
                      ? 'bg-brand-500/15 text-brand-400 font-semibold border-l-[3px] border-brand-400'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-slate-300 border-l-[3px] border-transparent'
                    }
                  `}>
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{n.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          <button onClick={() => setCollapsed(c => !c)} className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-3'} py-2 rounded-lg text-sidebar-text hover:bg-sidebar-hover text-xs transition-colors`}>
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
          <button
            onClick={() => { localStorage.removeItem('access_token'); window.location.href = '/login'; }}
            className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-3'} py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
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
              </Routes>
            </AppShell>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

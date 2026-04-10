import { create } from 'zustand';

interface VehiclePosition {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

interface GpsAlert {
  id: string;
  shipmentId: string;
  vehicleId: string;
  type: string;
  message: string;
  lat: number;
  lng: number;
  createdAt: string;
  acknowledged: boolean;
}

interface GpsState {
  positions: Record<string, VehiclePosition>;
  alerts: GpsAlert[];
  selectedVehicleId: string | null;
  selectedShipmentId: string | null;

  updateVehiclePosition: (vehicleId: string, pos: VehiclePosition) => void;
  addAlert: (alert: GpsAlert) => void;
  acknowledgeAlert: (alertId: string) => void;
  setSelectedVehicle: (vehicleId: string | null) => void;
  setSelectedShipment: (shipmentId: string | null) => void;
  getUnreadAlertCount: () => number;
}

export const useGpsStore = create<GpsState>((set, get) => ({
  positions: {},
  alerts: [],
  selectedVehicleId: null,
  selectedShipmentId: null,

  updateVehiclePosition: (vehicleId, pos) =>
    set((state) => ({
      positions: { ...state.positions, [vehicleId]: pos },
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
    })),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    })),

  setSelectedVehicle: (vehicleId) =>
    set({ selectedVehicleId: vehicleId }),

  setSelectedShipment: (shipmentId) =>
    set({ selectedShipmentId: shipmentId }),

  getUnreadAlertCount: () =>
    get().alerts.filter((a) => !a.acknowledged).length,
}));

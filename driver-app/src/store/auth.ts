import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: any | null;
  driverId: string | null;
  setAuth: (token: string, user: any) => void;
  setDriverId: (id: string) => void;
  logout: () => void;
}

export const store = create<AuthState>((set) => ({
  token: null,
  user: null,
  driverId: null,
  setAuth: (token, user) => set({ token, user }),
  setDriverId: (id) => set({ driverId: id }),
  logout: () => set({ token: null, user: null, driverId: null }),
}));

export const useAuth = () => store();

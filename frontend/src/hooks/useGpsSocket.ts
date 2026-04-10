import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGpsStore } from '../store/gpsStore';

const GPS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export function useGpsSocket(shipmentId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const { updateVehiclePosition, addAlert } = useGpsStore();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    socketRef.current = io(`${GPS_URL}/gps`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('GPS socket connected');
      if (shipmentId) {
        socketRef.current?.emit('subscribe:shipment', { shipmentId });
      }
    });

    socketRef.current.on('location:update', (data: {
      shipmentId: string;
      vehicleId: string;
      lat: number;
      lng: number;
      speed: number;
      heading: number;
      timestamp: string;
    }) => {
      updateVehiclePosition(data.vehicleId, {
        lat: data.lat,
        lng: data.lng,
        speed: data.speed,
        heading: data.heading,
        timestamp: data.timestamp,
      });
    });

    socketRef.current.on('alert:triggered', (alert: any) => {
      addAlert(alert);
    });

    socketRef.current.on('disconnect', () => {
      console.log('GPS socket disconnected');
    });

    return () => {
      if (shipmentId) {
        socketRef.current?.emit('unsubscribe:shipment', { shipmentId });
      }
      socketRef.current?.disconnect();
    };
  }, [shipmentId, updateVehiclePosition, addAlert]);

  const sendLocation = useCallback((data: {
    shipmentId: string;
    vehicleId: string;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
  }) => {
    socketRef.current?.emit('driver:location', data);
  }, []);

  return { sendLocation };
}

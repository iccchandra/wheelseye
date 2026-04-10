import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { attendanceApi } from '../services/api';
import { useAuth } from '../store/auth';

type Step = 'scan' | 'vehicle' | 'selfie' | 'confirm' | 'done';

export const ScannerScreen = ({ navigation }: any) => {
  const { driverId } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('scan');
  const [scanned, setScanned] = useState(false);
  const [vehicle, setVehicle] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      const parsed = JSON.parse(data);
      const vehicleId = parsed.id;
      const res = await attendanceApi.scanVehicle(vehicleId);
      setVehicle(res.data.vehicle);
      setTodayAttendance(res.data.todayAttendance || []);
      setStep('vehicle');
    } catch {
      Alert.alert('Invalid QR', 'This QR code is not a valid vehicle code.');
      setScanned(false);
    }
    setLoading(false);
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission required for selfie');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      setSelfieUri(result.assets[0].uri);
      setStep('confirm');
    }
  };

  const markAttendance = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!location) {
      Alert.alert('Location needed', 'Waiting for GPS location...');
      await getLocation();
      return;
    }
    setLoading(true);
    try {
      const res = await attendanceApi.mark({
        driverId,
        vehicleId: vehicle.id,
        type,
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
        deviceInfo: 'DriverApp/1.0',
      });
      setResult(res.data);
      setStep('done');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to mark attendance');
    }
    setLoading(false);
  };

  if (!permission) return <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  if (!permission.granted) {
    return (
      <View style={s.center}>
        <Feather name="camera-off" size={48} color="#94a3b8" />
        <Text style={s.permText}>Camera permission needed to scan QR</Text>
        <TouchableOpacity style={s.btn} onPress={requestPermission}>
          <Text style={s.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step: Scan QR
  if (step === 'scan') {
    return (
      <View style={s.scanContainer}>
        <CameraView style={s.camera} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}>
          <View style={s.scanOverlay}>
            <View style={s.scanFrame} />
            <Text style={s.scanText}>Point camera at vehicle QR code</Text>
          </View>
        </CameraView>
        {loading && <View style={s.loadingOverlay}><ActivityIndicator size="large" color="#fff" /></View>}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // Step: Vehicle details
  if (step === 'vehicle') {
    const lastRecord = todayAttendance.find((r: any) => r.driverId === driverId);
    const shouldCheckOut = lastRecord?.type === 'CHECK_IN';
    return (
      <View style={s.detailContainer}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Feather name="x" size={22} color="#64748b" />
        </TouchableOpacity>
        <View style={s.vehicleCard}>
          <View style={s.vehicleBadge}><Feather name="truck" size={28} color="#2563eb" /></View>
          <Text style={s.vehicleReg}>{vehicle.regNumber}</Text>
          <Text style={s.vehicleSub}>{vehicle.make} {vehicle.model} · {vehicle.type}</Text>
          <View style={s.vehicleStats}>
            <View style={s.statBox}><Text style={s.statVal}>{vehicle.capacityMT || 0}</Text><Text style={s.statLbl}>MT</Text></View>
            <View style={s.statBox}><Text style={[s.statVal, { color: vehicle.status === 'ON_TRIP' ? '#2563eb' : '#10b981' }]}>{vehicle.status}</Text><Text style={s.statLbl}>Status</Text></View>
          </View>
        </View>

        {location && (
          <View style={s.locBadge}>
            <Feather name="map-pin" size={12} color="#2563eb" />
            <Text style={s.locText}>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} · ±{location.accuracy?.toFixed(0)}m</Text>
          </View>
        )}

        <TouchableOpacity style={[s.btn, shouldCheckOut && { backgroundColor: '#f59e0b' }]} onPress={() => markAttendance(shouldCheckOut ? 'CHECK_OUT' : 'CHECK_IN')} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Feather name={shouldCheckOut ? 'log-out' : 'log-in'} size={18} color="#fff" />
              <Text style={s.btnText}>{shouldCheckOut ? 'Check Out' : 'Check In'}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={s.btnGhost} onPress={() => { setScanned(false); setStep('scan'); }}>
          <Text style={s.btnGhostText}>Scan Different Vehicle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step: Done
  if (step === 'done') {
    return (
      <View style={s.doneContainer}>
        <View style={s.doneBadge}>
          <Feather name="check-circle" size={64} color="#10b981" />
        </View>
        <Text style={s.doneTitle}>
          {result?.type === 'CHECK_IN' ? 'Checked In!' : 'Checked Out!'}
        </Text>
        <Text style={s.doneSub}>
          {vehicle?.regNumber} · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {result?.address && <Text style={s.doneAddr}>{result.address}</Text>}
        <TouchableOpacity style={s.btn} onPress={() => navigation.goBack()}>
          <Text style={s.btnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16, backgroundColor: '#f8fafc' },
  permText: { fontSize: 15, color: '#64748b', textAlign: 'center' },
  scanContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanFrame: { width: 250, height: 250, borderWidth: 3, borderColor: '#2563eb', borderRadius: 20 },
  scanText: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 20 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  closeBtn: { alignSelf: 'flex-end', padding: 8, marginBottom: 8 },
  detailContainer: { flex: 1, backgroundColor: '#f8fafc', padding: 24, justifyContent: 'center' },
  vehicleCard: { backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4, marginBottom: 20 },
  vehicleBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  vehicleReg: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  vehicleSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  vehicleStats: { flexDirection: 'row', gap: 24, marginTop: 20 },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statLbl: { fontSize: 10, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  locBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#eff6ff', borderRadius: 10, marginBottom: 16, alignSelf: 'center' },
  locText: { fontSize: 11, color: '#2563eb', fontWeight: '600' },
  btn: { backgroundColor: '#2563eb', borderRadius: 16, padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnGhost: { borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  btnGhostText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  doneContainer: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 32 },
  doneBadge: { marginBottom: 24 },
  doneTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  doneSub: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  doneAddr: { fontSize: 13, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
});

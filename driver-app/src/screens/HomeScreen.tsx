import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../store/auth';
import { attendanceApi } from '../services/api';

export const HomeScreen = ({ navigation }: any) => {
  const { user, driverId, logout } = useAuth();
  const [todaySummary, setTodaySummary] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    getLocation();
  }, []);

  const loadData = async () => {
    try {
      const res = await attendanceApi.getToday();
      setTodaySummary(res.data);
    } catch { /* ignore */ }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is needed for attendance');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(loc.coords);
  };

  const myRecords = todaySummary?.records?.filter((r: any) => r.driverId === driverId) || [];
  const isCheckedIn = myRecords.length > 0 && myRecords[0]?.type === 'CHECK_IN';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hello, {user?.name || 'Driver'}</Text>
          <Text style={s.subText}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Feather name="log-out" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Status card */}
      <View style={[s.statusCard, { backgroundColor: isCheckedIn ? '#ecfdf5' : '#fef2f2' }]}>
        <View style={[s.statusDot, { backgroundColor: isCheckedIn ? '#10b981' : '#ef4444' }]} />
        <Text style={[s.statusText, { color: isCheckedIn ? '#065f46' : '#991b1b' }]}>
          {isCheckedIn ? 'On Duty' : 'Off Duty'}
        </Text>
        {myRecords.length > 0 && (
          <Text style={s.lastAction}>
            Last: {myRecords[0].type === 'CHECK_IN' ? 'Checked in' : 'Checked out'} at {new Date(myRecords[0].createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Location */}
      {location && (
        <View style={s.locationBar}>
          <Feather name="map-pin" size={14} color="#3b82f6" />
          <Text style={s.locationText}>GPS: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
          <TouchableOpacity onPress={getLocation}><Feather name="refresh-cw" size={14} color="#94a3b8" /></TouchableOpacity>
        </View>
      )}

      {/* Action buttons */}
      <View style={s.actions}>
        <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Scanner')}>
          <View style={[s.actionIcon, { backgroundColor: '#eff6ff' }]}>
            <Feather name="camera" size={24} color="#2563eb" />
          </View>
          <Text style={s.actionTitle}>Scan QR</Text>
          <Text style={s.actionDesc}>Scan vehicle QR to mark attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('History')}>
          <View style={[s.actionIcon, { backgroundColor: '#f0fdf4' }]}>
            <Feather name="clock" size={24} color="#16a34a" />
          </View>
          <Text style={s.actionTitle}>My Attendance</Text>
          <Text style={s.actionDesc}>View attendance history & hours</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Trip')}>
          <View style={[s.actionIcon, { backgroundColor: '#fefce8' }]}>
            <Feather name="navigation" size={24} color="#ca8a04" />
          </View>
          <Text style={s.actionTitle}>Active Trip</Text>
          <Text style={s.actionDesc}>View current shipment details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Profile')}>
          <View style={[s.actionIcon, { backgroundColor: '#faf5ff' }]}>
            <Feather name="user" size={24} color="#7c3aed" />
          </View>
          <Text style={s.actionTitle}>My Profile</Text>
          <Text style={s.actionDesc}>View licence & documents</Text>
        </TouchableOpacity>
      </View>

      {/* Today's log */}
      {myRecords.length > 0 && (
        <View style={s.logSection}>
          <Text style={s.logTitle}>Today's Activity</Text>
          {myRecords.map((r: any, i: number) => (
            <View key={r.id || i} style={s.logRow}>
              <View style={[s.logDot, { backgroundColor: r.type === 'CHECK_IN' ? '#10b981' : '#f59e0b' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.logType}>{r.type === 'CHECK_IN' ? 'Check In' : 'Check Out'}</Text>
                <Text style={s.logAddr}>{r.address || `${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)}`}</Text>
              </View>
              <Text style={s.logTime}>{new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subText: { fontSize: 13, color: '#64748b', marginTop: 2 },
  logoutBtn: { padding: 10, backgroundColor: '#fef2f2', borderRadius: 12 },
  statusCard: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 16, fontWeight: '700', flex: 1 },
  lastAction: { fontSize: 11, color: '#64748b' },
  locationBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#eff6ff', borderRadius: 12, marginBottom: 20 },
  locationText: { flex: 1, fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  actionDesc: { fontSize: 11, color: '#94a3b8' },
  logSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  logTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logType: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  logAddr: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  logTime: { fontSize: 12, fontWeight: '600', color: '#334155' },
});

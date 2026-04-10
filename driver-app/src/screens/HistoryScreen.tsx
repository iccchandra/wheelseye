import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { attendanceApi } from '../services/api';
import { useAuth } from '../store/auth';

export const HistoryScreen = () => {
  const { driverId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;
    attendanceApi.getDriverHistory(driverId)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [driverId]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  const records = data?.records || [];
  const pairs = data?.pairs || [];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Summary */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={[s.summaryVal, { color: '#2563eb' }]}>{data?.totalDays || 0}</Text>
          <Text style={s.summaryLbl}>Days</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryVal, { color: '#10b981' }]}>{data?.totalHoursFormatted || '0h'}</Text>
          <Text style={s.summaryLbl}>Hours</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryVal, { color: '#f59e0b' }]}>{records.length}</Text>
          <Text style={s.summaryLbl}>Entries</Text>
        </View>
      </View>

      {/* Shift pairs */}
      {pairs.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Shifts</Text>
          {pairs.slice(0, 10).map((p: any, i: number) => (
            <View key={i} style={s.shiftCard}>
              <View style={s.shiftHeader}>
                <Text style={s.shiftDate}>
                  {new Date(p.checkIn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
                <Text style={s.shiftDuration}>
                  {Math.floor(p.minutes / 60)}h {p.minutes % 60}m
                </Text>
              </View>
              <View style={s.shiftTimes}>
                <View style={s.shiftTime}>
                  <View style={[s.dot, { backgroundColor: '#10b981' }]} />
                  <Text style={s.timeLabel}>In</Text>
                  <Text style={s.timeValue}>
                    {new Date(p.checkIn.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={s.shiftLine} />
                <View style={s.shiftTime}>
                  <View style={[s.dot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={s.timeLabel}>Out</Text>
                  <Text style={s.timeValue}>
                    {new Date(p.checkOut.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <Text style={s.shiftVehicle}>
                {p.checkIn.vehicleSnapshot?.regNumber || '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* All records */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>All Records</Text>
        {records.length === 0 && <Text style={s.emptyText}>No attendance records yet</Text>}
        {records.map((r: any) => (
          <View key={r.id} style={s.recordRow}>
            <View style={[s.recordDot, { backgroundColor: r.type === 'CHECK_IN' ? '#10b981' : '#f59e0b' }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.recordType}>{r.type === 'CHECK_IN' ? 'Check In' : 'Check Out'}</Text>
              <Text style={s.recordAddr}>{r.address || '—'}</Text>
              <Text style={s.recordVehicle}>{r.vehicle?.regNumber || r.vehicleSnapshot?.regNumber || '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.recordTime}>
                {new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={s.recordDate}>
                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  summaryVal: { fontSize: 24, fontWeight: '800' },
  summaryLbl: { fontSize: 10, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 32 },
  shiftCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  shiftDate: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  shiftDuration: { fontSize: 14, fontWeight: '800', color: '#2563eb' },
  shiftTimes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shiftTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shiftLine: { flex: 1, height: 1.5, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  timeLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  timeValue: { fontSize: 13, fontWeight: '700', color: '#334155' },
  shiftVehicle: { fontSize: 12, color: '#64748b', marginTop: 8 },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  recordDot: { width: 10, height: 10, borderRadius: 5 },
  recordType: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  recordAddr: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  recordVehicle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  recordTime: { fontSize: 13, fontWeight: '700', color: '#334155' },
  recordDate: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { supabase, Junction, Trip } from '../../../lib/supabase';
import RippleButton from '../../../components/RippleButton';
import LiveMap, { MapItem } from '../../../components/LiveMap';
import { distanceKm, etaMinutes } from '../../../lib/geo';
import { C } from '../../../lib/theme';

export default function Police() {
  const { profile, signOut } = useAuth();
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [junctionId, setJunctionId] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cleared, setCleared] = useState<string[]>([]);

  const junction = junctions.find((j) => j.id === junctionId) ?? null;

  useEffect(() => {
    (async () => {
      const { data: js } = await supabase.from('junctions').select('*').order('name');
      setJunctions((js as Junction[]) ?? []);
      const { data: st } = await supabase.from('police_status').select('*')
        .eq('user_id', profile!.id).maybeSingle();
      if (st) { setActive(st.active); setJunctionId(st.junction_id); }
    })();
  }, []);

  const loadTrips = useCallback(async () => {
    if (!junctionId) return;
    const { data } = await supabase.from('trips').select('*')
      .eq('status', 'active').contains('junction_ids', [junctionId]);
    setTrips((prev) => {
      const next = (data as Trip[]) ?? [];
      if (next.length > prev.length) Vibration.vibrate([0, 500, 200, 500]);
      return next;
    });
  }, [junctionId]);

  useEffect(() => {
    if (!active || !junctionId) { setTrips([]); return; }
    loadTrips();
    const ch = supabase.channel('trips-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => loadTrips())
      .subscribe();
    const poll = setInterval(loadTrips, 10000); // safety net
    return () => { supabase.removeChannel(ch); clearInterval(poll); };
  }, [active, junctionId, loadTrips]);

  async function setStatus(next: boolean) {
    if (next && !junctionId) return Alert.alert('Select your junction first');
    const { error } = await supabase.from('police_status').upsert({
      user_id: profile!.id, active: next, junction_id: junctionId, updated_at: new Date().toISOString(),
    });
    if (error) return Alert.alert('Error', error.message);
    setActive(next);
  }

  async function markCleared(t: Trip) {
    if (!junctionId) return;
    const { error } = await supabase.from('clearances').upsert(
      { trip_id: t.id, junction_id: junctionId, officer_id: profile!.id },
      { onConflict: 'trip_id,junction_id' }
    );
    if (error) return Alert.alert('Error', error.message);
    setCleared((c) => [...c, t.id]);
  }

  const mapItems: MapItem[] = useMemo(() => {
    const items: MapItem[] = [];
    if (junction) items.push({ lat: junction.lat, lng: junction.lng, label: junction.name, type: 'junction' });
    trips.forEach((t) => {
      if (t.lat != null && t.lng != null)
        items.push({ lat: t.lat, lng: t.lng, label: 'Ambulance', type: 'ambulance' });
    });
    return items;
  }, [junction, trips]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.hi}>Traffic Authority</Text>
          <Text style={s.name}>{profile?.full_name || profile?.email}</Text>
        </View>
        <Pressable onPress={signOut}><Text style={s.logout}>Logout</Text></Pressable>
      </View>

      {!active ? (
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Your junction / area</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} style={{ flexGrow: 0 }}>
            {junctions.map((j) => (
              <Pressable key={j.id} onPress={() => setJunctionId(j.id)}
                style={[s.chip, junctionId === j.id && s.chipOn]}>
                <Text style={[s.chipText, junctionId === j.id && { color: '#fff' }]}>{j.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={s.center}>
            <RippleButton label="GO ACTIVE" sub="START DUTY" size={190} onPress={() => setStatus(true)} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={s.status}>
            <Text style={s.statusText}>🟢 ACTIVE at {junction?.name}</Text>
            <Pressable onPress={() => setStatus(false)}><Text style={s.off}>Go offline</Text></Pressable>
          </View>

          {trips.length === 0 && <Text style={s.empty}>No ambulance approaching. Stay alert.</Text>}

          {trips.map((t) => {
            const km = junction && t.lat != null && t.lng != null
              ? distanceKm(t.lat, t.lng, junction.lat, junction.lng) : null;
            return (
              <View key={t.id} style={s.alert}>
                <Text style={s.alertTitle}>🚨 AMBULANCE ARRIVING – CLEAR THE ROAD</Text>
                <Text style={s.alertLine}>Driver: {t.driver_name}</Text>
                <Text style={s.alertLine}>Going to: {t.destination}</Text>
                {km != null && <Text style={s.alertLine}>{km.toFixed(1)} km away · ETA ~{etaMinutes(km)} min</Text>}
                <Pressable
                  style={[s.clearBtn, cleared.includes(t.id) && { backgroundColor: C.green }]}
                  onPress={() => markCleared(t)}>
                  <Text style={s.clearText}>{cleared.includes(t.id) ? '✓ TRAFFIC CLEARED' : 'MARK TRAFFIC CLEARED'}</Text>
                </Pressable>
              </View>
            );
          })}

          <Text style={s.label}>Live map</Text>
          <LiveMap items={mapItems} height={320} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.peach },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  hi: { color: C.muted, fontWeight: '700' },
  name: { color: C.maroon, fontSize: 20, fontWeight: '900' },
  logout: { color: C.maroon, fontWeight: '800' },
  label: { color: C.maroon, fontWeight: '800', paddingHorizontal: 16, marginBottom: 8, fontSize: 16 },
  chip: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: C.peachDark },
  chipOn: { backgroundColor: C.maroon, borderColor: C.maroon },
  chipText: { color: C.text, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  status: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { color: C.green, fontWeight: '900' },
  off: { color: C.maroon, fontWeight: '800' },
  empty: { color: C.muted, textAlign: 'center', padding: 20, fontWeight: '600' },
  alert: { backgroundColor: C.maroon, borderRadius: 16, padding: 16, gap: 6 },
  alertTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  alertLine: { color: C.peach, fontWeight: '600' },
  clearBtn: { backgroundColor: C.maroonDark, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 6 },
  clearText: { color: '#fff', fontWeight: '900' },
});
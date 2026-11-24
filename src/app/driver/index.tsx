import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../../context/AuthContext';
import { supabase, Junction } from '../../../lib/supabase';
import RippleButton from '../../../components/RippleButton';
import LiveMap, { MapItem } from '../../../components/LiveMap';
import { C } from '../../../lib/theme';

type Phase = 'idle' | 'select' | 'active';

export default function Driver() {
  const { profile, signOut } = useAuth();
  const [phase, setPhase] = useState<Phase>('idle');
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [destination, setDestination] = useState('');
  const [tripId, setTripId] = useState<string | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const lastPush = useRef(0);

  useEffect(() => () => { watcher.current?.remove(); }, []);

  async function onSOS() {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return Alert.alert('Location permission is needed');
    const { data, error } = await supabase.from('junctions').select('*').order('name');
    if (error) return Alert.alert('Error', error.message);
    setJunctions((data as Junction[]) ?? []);
    try {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
    } catch {}
    setSelected([]);
    setPhase('select');
  }

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function startEmergency() {
    if (!destination.trim()) return Alert.alert('Enter the destination hospital');
    setBusy(true);
    try {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = p.coords.latitude, lng = p.coords.longitude;
      setPos({ lat, lng });

      const { data: trip, error } = await supabase.from('trips').insert({
        driver_id: profile!.id,
        driver_name: profile!.full_name,
        destination: destination.trim(),
        junction_ids: selected,
        lat, lng,
        status: 'active',
      }).select().single();
      if (error) throw error;

      // PROTOTYPE: the siren fires even if no junction is selected
      const commands: { trip_id: string; junction_id: string | null }[] = selected.length
        ? selected.map((j) => ({ trip_id: trip.id, junction_id: j }))
        : [{ trip_id: trip.id, junction_id: null }];
      const { error: e2 } = await supabase.from('siren_commands').insert(commands as any);
      if (e2) throw e2;

      setTripId(trip.id);
      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 3000 },
        (loc) => {
          const la = loc.coords.latitude, ln = loc.coords.longitude;
          setPos({ lat: la, lng: ln });
          if (Date.now() - lastPush.current > 3000) {
            lastPush.current = Date.now();
            supabase.from('trips')
              .update({ lat: la, lng: ln, updated_at: new Date().toISOString() })
              .eq('id', trip.id).then();
          }
        }
      );
      setPhase('active');
    } catch (e: any) {
      Alert.alert('Could not start', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function endTrip() {
    watcher.current?.remove();
    watcher.current = null;
    if (tripId) await supabase.from('trips').update({ status: 'ended' }).eq('id', tripId);
    setTripId(null);
    setDestination('');
    setSelected([]);
    setPhase('idle');
  }

  const mapItems: MapItem[] = useMemo(() => {
    const items: MapItem[] = junctions.map((j) => ({
      lat: j.lat, lng: j.lng, label: j.name,
      type: selected.includes(j.id) ? 'selected' : 'junction',
    }));
    if (phase === 'active') {
      const sel = items.filter((i) => i.type === 'selected');
      if (pos) sel.push({ lat: pos.lat, lng: pos.lng, label: 'You', type: 'ambulance' });
      return sel;
    }
    if (pos) items.push({ lat: pos.lat, lng: pos.lng, label: 'You', type: 'ambulance' });
    return items;
  }, [junctions, selected, pos, phase]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.hi}>Driver</Text>
          <Text style={s.name}>{profile?.full_name || profile?.email}</Text>
        </View>
        <Pressable onPress={signOut}><Text style={s.logout}>Logout</Text></Pressable>
      </View>

      {phase === 'idle' && (
        <View style={s.center}>
          <RippleButton label="SOS" sub="TAP IN EMERGENCY" onPress={onSOS} />
        </View>
      )}

      {phase === 'select' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Text style={s.title}>Junctions with sirens</Text>
          <Text style={s.hint}>Select the ones on your route</Text>
          <LiveMap items={mapItems} height={220} />
          {junctions.map((j) => {
            const on = selected.includes(j.id);
            return (
              <Pressable key={j.id} onPress={() => toggle(j.id)} style={[s.row, on && s.rowOn]}>
                <Text style={[s.rowText, on && { color: '#fff' }]}>{on ? '✓  ' : ''}{j.name}</Text>
              </Pressable>
            );
          })}
          <TextInput style={s.input} placeholder="Destination hospital" placeholderTextColor={C.muted}
            value={destination} onChangeText={setDestination} />
          <Pressable style={s.start} onPress={startEmergency} disabled={busy}>
            <Text style={s.startText}>{busy ? 'STARTING…' : 'START EMERGENCY'}</Text>
          </Pressable>
          <Pressable onPress={() => setPhase('idle')}><Text style={s.cancel}>Cancel</Text></Pressable>
        </ScrollView>
      )}

      {phase === 'active' && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={s.banner}>
            <Text style={s.bannerTitle}>🚨 EMERGENCY ACTIVE</Text>
            <Text style={s.bannerSub}>To: {destination}</Text>
            <Text style={s.bannerSub}>Sirens triggered at {selected.length || 'default'} junction(s)</Text>
          </View>
          <LiveMap items={mapItems} height={360} />
          <Pressable style={s.end} onPress={endTrip}>
            <Text style={s.startText}>END TRIP / RESET ALERTS</Text>
          </Pressable>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: C.maroon, fontSize: 22, fontWeight: '900' },
  hint: { color: C.muted, marginBottom: 4 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: C.peachDark },
  rowOn: { backgroundColor: C.maroon, borderColor: C.maroon },
  rowText: { color: C.text, fontWeight: '700', fontSize: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, color: C.text, borderWidth: 2, borderColor: C.peachDark },
  start: { backgroundColor: C.maroon, borderRadius: 14, padding: 18, alignItems: 'center' },
  end: { backgroundColor: C.maroonDark, borderRadius: 14, padding: 18, alignItems: 'center' },
  startText: { color: '#fff', fontWeight: '900', letterSpacing: 1, fontSize: 16 },
  cancel: { color: C.maroon, textAlign: 'center', fontWeight: '700', padding: 8 },
  banner: { backgroundColor: C.maroon, borderRadius: 16, padding: 16, gap: 4 },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  bannerSub: { color: C.peach, fontWeight: '600' },
});
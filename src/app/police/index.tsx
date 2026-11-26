import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { supabase, Junction, Trip } from '../../../lib/supabase';
import LiveMap, { MapItem } from '../../../components/LiveMap';
import { distanceKm, etaMinutes } from '../../../lib/geo';
import { C } from '../../../lib/theme';

/* Green pulsing ripple button (UI only) */
function GreenRipple({ size = 170, onPress }: { size?: number; onPress: () => void }) {
  const rings = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anims = rings.map((v, i) =>
      Animated.sequence([
        Animated.delay(i * 800),
        Animated.loop(
          Animated.timing(v, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          })
        ),
      ])
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [rings]);

  const box = size * 2;

  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      {rings.map((v, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: C.green,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
          }}
        />
      ))}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: C.green,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 10,
            borderWidth: 6,
            borderColor: 'rgba(255,255,255,0.35)',
          },
          pressed && { transform: [{ scale: 0.96 }] },
        ]}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 }}>ACTIVE</Text>
      </Pressable>
    </View>
  );
}

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

  const initial = (profile?.full_name || profile?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
          <View style={{ flexShrink: 1 }}>
            <Text style={s.hi}>Traffic Authority</Text>
            <Text style={s.name} numberOfLines={1}>{profile?.full_name || profile?.email}</Text>
          </View>
        </View>
        <Pressable onPress={signOut} style={({ pressed }) => [s.logoutBtn, pressed && { opacity: 0.7 }]}>
          <Text style={s.logout}>Logout</Text>
        </Pressable>
      </View>

      {!active ? (
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Your junction / area</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 4 }}
            style={{ flexGrow: 0 }}>
            {junctions.map((j) => (
              <Pressable key={j.id} onPress={() => setJunctionId(j.id)}
                style={[s.chip, junctionId === j.id && s.chipOn]}>
                <Text style={[s.chipText, junctionId === j.id && { color: '#fff' }]}>{j.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={s.center}>
            <GreenRipple size={170} onPress={() => setStatus(true)} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
          <View style={s.status}>
            <View style={s.statusLeft}>
              <View style={s.dot} />
              <Text style={s.statusText} numberOfLines={1}>ACTIVE at {junction?.name}</Text>
            </View>
            <Pressable onPress={() => setStatus(false)} style={({ pressed }) => [s.offBtn, pressed && { opacity: 0.7 }]}>
              <Text style={s.off}>Go offline</Text>
            </Pressable>
          </View>

          {trips.length === 0 && (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>🛡️</Text>
              <Text style={s.empty}>No ambulance approaching. Stay alert.</Text>
            </View>
          )}

          {trips.map((t) => {
            const km = junction && t.lat != null && t.lng != null
              ? distanceKm(t.lat, t.lng, junction.lat, junction.lng) : null;
            const done = cleared.includes(t.id);
            return (
              <View key={t.id} style={s.alert}>
                <Text style={s.alertTitle}>🚨 AMBULANCE ARRIVING – CLEAR THE ROAD</Text>
                <View style={s.divider} />
                <View style={s.row}>
                  <Text style={s.alertKey}>Driver</Text>
                  <Text style={s.alertVal}>{t.driver_name}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.alertKey}>Going to</Text>
                  <Text style={s.alertVal}>{t.destination}</Text>
                </View>
                {km != null && (
                  <View style={s.distPill}>
                    <Text style={s.distText}>{km.toFixed(1)} km away · ETA ~{etaMinutes(km)} min</Text>
                  </View>
                )}
                <Pressable
                  style={({ pressed }) => [s.clearBtn, done && { backgroundColor: C.green }, pressed && { opacity: 0.85 }]}
                  onPress={() => markCleared(t)}>
                  <Text style={s.clearText}>{done ? '✓ TRAFFIC CLEARED' : 'MARK TRAFFIC CLEARED'}</Text>
                </Pressable>
              </View>
            );
          })}

          <Text style={[s.label, { paddingHorizontal: 0, marginBottom: 0 }]}>Live map</Text>
          <View style={s.mapWrap}>
            <LiveMap items={mapItems} height={320} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.peach },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: C.maroon,
    alignItems: 'center', justifyContent: 'center', elevation: 3,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  hi: { color: C.muted, fontWeight: '700', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  name: { color: C.maroon, fontSize: 20, fontWeight: '900' },
  logoutBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 2, borderColor: C.maroon,
  },
  logout: { color: C.maroon, fontWeight: '800' },

  label: { color: C.maroon, fontWeight: '800', paddingHorizontal: 16, marginBottom: 10, fontSize: 16, marginTop: 4 },
  chip: {
    backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22,
    borderWidth: 2, borderColor: C.peachDark, elevation: 1,
  },
  chipOn: { backgroundColor: C.maroon, borderColor: C.maroon, elevation: 4 },
  chipText: { color: C.text, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  status: {
    backgroundColor: '#fff', borderRadius: 18, padding: 14, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', elevation: 3,
    borderLeftWidth: 6, borderLeftColor: C.green,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.green },
  statusText: { color: C.green, fontWeight: '900', fontSize: 15, flexShrink: 1 },
  offBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.peach,
  },
  off: { color: C.maroon, fontWeight: '800' },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 24, alignItems: 'center', gap: 8, elevation: 2,
  },
  emptyIcon: { fontSize: 32 },
  empty: { color: C.muted, textAlign: 'center', fontWeight: '600' },

  alert: { backgroundColor: C.maroon, borderRadius: 20, padding: 18, gap: 8, elevation: 6 },
  alertTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  alertKey: { color: C.peachDark, fontWeight: '700' },
  alertVal: { color: C.peach, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  distPill: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, marginTop: 4,
  },
  distText: { color: '#fff', fontWeight: '800' },
  clearBtn: {
    backgroundColor: C.maroonDark, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 8,
  },
  clearText: { color: '#fff', fontWeight: '900', letterSpacing: 0.5 },

  mapWrap: { borderRadius: 20, overflow: 'hidden', elevation: 3, backgroundColor: '#fff' },
});
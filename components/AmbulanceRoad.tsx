import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../lib/theme';

/* ---------- round logo with a white cross ---------- */
export function LogoMark({ size = 72 }: { size?: number }) {
  const arm = size * 0.46;
  const thick = size * 0.16;
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: C.maroon,
        alignItems: 'center', justifyContent: 'center', elevation: 6,
        borderWidth: 3, borderColor: C.white,
      }}
    >
      <View style={{ position: 'absolute', width: thick, height: arm, backgroundColor: C.white, borderRadius: 2 }} />
      <View style={{ position: 'absolute', width: arm, height: thick, backgroundColor: C.white, borderRadius: 2 }} />
    </View>
  );
}

/* ---------- ambulance (side view, faces right) ---------- */
function Wheel({ left, rotate }: { left: number; rotate: Animated.AnimatedInterpolation<string> }) {
  return (
    <View style={[a.tire, { left }]}>
      <Animated.View style={[a.rim, { transform: [{ rotate }] }]}>
        <View style={a.spoke} />
        <View style={[a.spoke, { transform: [{ rotate: '90deg' }] }]} />
        <View style={[a.spoke, { transform: [{ rotate: '45deg' }] }]} />
        <View style={[a.spoke, { transform: [{ rotate: '135deg' }] }]} />
      </Animated.View>
      <View style={a.hub} />
    </View>
  );
}

function Ambulance() {
  const phase = useRef(new Animated.Value(0)).current; // light bar alternation
  const spin = useRef(new Animated.Value(0)).current;  // wheel rotation

  useEffect(() => {
    const flash = Animated.loop(
      Animated.sequence([
        Animated.timing(phase, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.delay(220),
        Animated.timing(phase, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.delay(220),
      ])
    );
    const roll = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 600, easing: Easing.linear, useNativeDriver: true })
    );
    flash.start();
    roll.start();
    return () => { flash.stop(); roll.stop(); };
  }, [phase, spin]);

  const redOp = phase.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });
  const blueOp = phase.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] });
  const redGlow = phase.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });
  const blueGlow = phase.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={a.wrap}>
      {/* ground shadow */}
      <View style={a.shadow} />

      {/* light glow */}
      <Animated.View style={[a.glow, { left: 49, backgroundColor: '#E53935', opacity: redGlow }]} />
      <Animated.View style={[a.glow, { left: 61, backgroundColor: '#1E88E5', opacity: blueGlow }]} />

      {/* light bar */}
      <View style={a.barBase}>
        <Animated.View style={[a.barHalf, { left: 1, backgroundColor: '#E53935', opacity: redOp }]} />
        <Animated.View style={[a.barHalf, { left: 12, backgroundColor: '#1E88E5', opacity: blueOp }]} />
      </View>

      {/* patient box */}
      <View style={a.box}>
        <View style={a.seam} />
        <View style={a.handle} />
        <View style={a.badge}>
          <View style={a.badgeV} />
          <View style={a.badgeH} />
        </View>
        <View style={a.boxWindow} />
        <Text style={a.label} allowFontScaling={false}>AMBULANCE</Text>
        <View style={a.stripe} />
      </View>

      {/* hood + cab */}
      <View style={a.hood} />
      <View style={a.cab} />
      <View style={a.cabWindow}><View style={a.shine} /></View>
      <View style={a.cabDoor} />
      <View style={a.cabHandle} />
      <View style={a.mirror} />

      {/* lights, bumpers */}
      <View style={a.tail} />
      <View style={a.rearBumper} />
      <View style={a.frontBumper} />
      <View style={a.beam} />
      <View style={a.headlight} />

      {/* wheel arches and wheels */}
      <View style={[a.arch, { left: 14 }]} />
      <View style={[a.arch, { left: 94 }]} />
      <Wheel left={16} rotate={rotate} />
      <Wheel left={96} rotate={rotate} />
    </View>
  );
}

/* ---------- realistic hospital ---------- */
const GLASS = '#9CCBE0';
const GLASS_LIT = '#FFE7A1';

function Win({ w, lit }: { w: number; lit: boolean }) {
  return (
    <View style={[hs.win, { width: w, backgroundColor: lit ? GLASS_LIT : GLASS }]}>
      <View style={hs.shine} />
    </View>
  );
}

function Floor({ cols, w, row }: { cols: number; w: number; row: number }) {
  return (
    <View style={hs.floor}>
      {Array.from({ length: cols }).map((_, c) => (
        <Win key={c} w={w} lit={(row * 3 + c * 2) % 5 === 0} />
      ))}
    </View>
  );
}

function Hospital() {
  return (
    <View style={hs.row}>
      {/* left wing */}
      <View style={[hs.wing, { backgroundColor: '#EFE6E1' }]}>
        <View style={hs.wingParapet} />
        {[0, 1, 2].map((i) => <Floor key={i} cols={2} w={7} row={i + 1} />)}
        <View style={hs.leftGround}>
          <View style={hs.floorInner}>
            <Win w={7} lit={false} />
            <Win w={7} lit={false} />
          </View>
          <View style={hs.shrubRow}>
            <View style={hs.shrub} /><View style={[hs.shrub, { width: 8, height: 8 }]} /><View style={hs.shrub} />
          </View>
        </View>
      </View>

      {/* central tower */}
      <View style={hs.tower}>
        <View style={hs.roof}>
          <View style={hs.lift} />
          <View style={hs.ac} />
          <View style={hs.antenna}><View style={hs.antennaTip} /></View>
        </View>
        <View style={hs.towerBody}>
          <View style={hs.parapet} />
          <View style={hs.signBand}>
            <View style={hs.signCross}>
              <View style={hs.signCrossV} />
              <View style={hs.signCrossH} />
            </View>
            <Text style={hs.signText} allowFontScaling={false}>HOSPITAL</Text>
          </View>
          {[0, 1, 2, 3].map((i) => <Floor key={i} cols={3} w={12} row={i} />)}
          <View style={hs.ground}>
            <View style={hs.canopy} />
            <View style={hs.door}>
              <View style={hs.pane} />
              <View style={hs.paneGap} />
              <View style={hs.pane} />
            </View>
            <View style={hs.step} />
          </View>
          <View style={hs.towerShade} />
        </View>
      </View>

      {/* right wing with emergency entrance */}
      <View style={[hs.wing, { backgroundColor: '#EFE6E1' }]}>
        <View style={hs.wingParapet} />
        {[0, 1, 2].map((i) => <Floor key={i} cols={2} w={7} row={i + 2} />)}
        <View style={hs.rightGround}>
          <View style={hs.erSign}>
            <Text style={hs.erText} allowFontScaling={false}>ER</Text>
          </View>
          <View style={hs.erDoor} />
        </View>
      </View>
    </View>
  );
}

/* ---------- skyline ---------- */
const BUILDINGS: { w: number; h: number; hospital?: boolean }[] = [
  { w: 34, h: 52 }, { w: 46, h: 78 }, { w: 30, h: 44 },
  { w: 104, h: 120, hospital: true },
  { w: 38, h: 62 }, { w: 48, h: 84 }, { w: 34, h: 58 },
];

function Building({ w, h }: { w: number; h: number }) {
  const cols = w > 40 ? 3 : 2;
  const rows = Math.max(2, Math.floor((h - 10) / 18));
  return (
    <View style={[b.base, { width: w, height: h, backgroundColor: C.peachDark, opacity: 0.85 }]}>
      <View style={b.windows}>
        {Array.from({ length: rows * cols }).map((_, i) => (
          <View key={i} style={[b.window, { width: (w - 12 - cols * 4) / cols }]} />
        ))}
      </View>
    </View>
  );
}

/* ---------- full bottom scene ---------- */
export default function AmbulanceRoad() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const x = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    x.setValue(-150);
    const loop = Animated.loop(
      Animated.timing(x, { toValue: width + 20, duration: 7000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [width, x]);

  return (
    <View style={r.scene} pointerEvents="none">
      <View style={r.skyline}>
        {BUILDINGS.map((bd, i) =>
          bd.hospital ? <Hospital key={i} /> : <Building key={i} w={bd.w} h={bd.h} />
        )}
      </View>

      <View style={r.pavement} />
      <View style={[r.road, { height: 38 + insets.bottom }]}>
        <View style={r.dashRow}>
          {Array.from({ length: 12 }).map((_, i) => <View key={i} style={r.dash} />)}
        </View>
      </View>

      <Animated.View style={{ position: 'absolute', left: 0, bottom: insets.bottom + 8, transform: [{ translateX: x }] }}>
        <Ambulance />
      </Animated.View>
    </View>
  );
}

const r = StyleSheet.create({
  scene: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  skyline: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-evenly' },
  pavement: { height: 6, backgroundColor: '#E2AE90' },
  road: { backgroundColor: '#3B2A2F' },
  dashRow: { position: 'absolute', left: 0, right: 0, top: 17, flexDirection: 'row', justifyContent: 'space-evenly' },
  dash: { width: 22, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.85)' },
});

const b = StyleSheet.create({
  base: { borderTopLeftRadius: 4, borderTopRightRadius: 4, alignItems: 'center', paddingTop: 8 },
  windows: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, paddingHorizontal: 4 },
  window: { height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)', marginBottom: 6 },
});

/* hospital styles */
const hs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', width: 104, height: 120 },

  // windows / floors
  win: { height: 9, borderRadius: 1.5, borderWidth: 1, borderColor: '#7FA9BC', overflow: 'hidden' },
  shine: { position: 'absolute', top: 0, left: 1, width: '40%', height: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  floor: {
    height: 15, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)',
  },
  floorInner: { flexDirection: 'row', justifyContent: 'space-evenly', alignSelf: 'stretch' },

  // wings
  wing: { width: 24, height: 72 },
  wingParapet: { height: 4, backgroundColor: '#D9C8BF' },
  leftGround: { height: 23, paddingTop: 4, justifyContent: 'space-between' },
  shrubRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 1 },
  shrub: { width: 6, height: 6, borderRadius: 4, backgroundColor: '#5E8C5A' },
  rightGround: { height: 23, alignItems: 'center', paddingTop: 2 },
  erSign: { width: 18, height: 9, borderRadius: 1.5, backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center' },
  erText: { color: '#fff', fontSize: 6, fontWeight: '800', includeFontPadding: false },
  erDoor: { width: 14, height: 12, marginTop: 0, backgroundColor: '#6FA8C0', borderTopLeftRadius: 1, borderTopRightRadius: 1, borderWidth: 1, borderColor: '#4F8199' },

  // tower
  tower: { width: 56, height: 120 },
  roof: { height: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-evenly' },
  lift: { width: 14, height: 8, backgroundColor: '#CDBDB4' },
  ac: { width: 12, height: 5, backgroundColor: '#B8B8B8', borderWidth: 1, borderColor: '#9A9A9A' },
  antenna: { width: 1.5, height: 10, backgroundColor: '#777' },
  antennaTip: { position: 'absolute', top: 0, left: -0.75, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#E53935' },
  towerBody: { height: 110, backgroundColor: '#F8F2EE' },
  towerShade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, backgroundColor: 'rgba(0,0,0,0.06)' },
  parapet: { height: 5, backgroundColor: '#D9C8BF' },
  signBand: {
    height: 20, marginTop: 3, backgroundColor: C.maroon,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  signCross: { width: 11, height: 11 },
  signCrossV: { position: 'absolute', left: 4, top: 0, width: 3, height: 11, backgroundColor: '#fff', borderRadius: 1 },
  signCrossH: { position: 'absolute', left: 0, top: 4, width: 11, height: 3, backgroundColor: '#fff', borderRadius: 1 },
  signText: { color: '#fff', fontSize: 6.5, fontWeight: '800', letterSpacing: 0.4, includeFontPadding: false },
  ground: { height: 22, alignItems: 'center' },
  canopy: { width: 34, height: 4, backgroundColor: C.maroon, borderRadius: 1 },
  door: { width: 26, height: 15, flexDirection: 'row', backgroundColor: '#7FB6CE', borderWidth: 1, borderColor: '#4F8199' },
  pane: { flex: 1, backgroundColor: '#A8D8EA' },
  paneGap: { width: 1, backgroundColor: '#4F8199' },
  step: { width: 40, height: 3, backgroundColor: '#CFC3BC' },
});

/* ambulance styles */
const a = StyleSheet.create({
  wrap: { width: 140, height: 60 },
  shadow: { position: 'absolute', left: 4, top: 56, width: 118, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.25)' },

  glow: { position: 'absolute', top: -1, width: 24, height: 14, borderRadius: 12 },
  barBase: { position: 'absolute', left: 55, top: 6, width: 24, height: 6, borderRadius: 2, backgroundColor: '#444' },
  barHalf: { position: 'absolute', top: 0.5, width: 11, height: 5, borderRadius: 2 },

  box: {
    position: 'absolute', left: 3, top: 12, width: 84, height: 36, backgroundColor: C.white,
    borderTopLeftRadius: 7, borderTopRightRadius: 3, borderBottomLeftRadius: 3,
    borderWidth: 1, borderColor: C.peachDark, overflow: 'hidden',
  },
  seam: { position: 'absolute', left: 12, top: 3, width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.15)' },
  handle: { position: 'absolute', left: 15, top: 15, width: 3, height: 6, borderRadius: 1, backgroundColor: '#9E9E9E' },
  badge: { position: 'absolute', left: 22, top: 3, width: 12, height: 12 },
  badgeV: { position: 'absolute', left: 4, top: 0, width: 4, height: 12, backgroundColor: C.maroon, borderRadius: 1 },
  badgeH: { position: 'absolute', left: 0, top: 4, width: 12, height: 4, backgroundColor: C.maroon, borderRadius: 1 },
  boxWindow: {
    position: 'absolute', left: 60, top: 4, width: 16, height: 9, borderRadius: 2,
    backgroundColor: '#BFE3F2', borderWidth: 1, borderColor: '#7FA9BC',
  },
  label: { position: 'absolute', left: 20, top: 16, color: C.maroon, fontSize: 6.5, fontWeight: '800', letterSpacing: 0.5, includeFontPadding: false },
  stripe: { position: 'absolute', left: 0, right: 0, bottom: 4, height: 5, backgroundColor: C.maroon },

  hood: {
    position: 'absolute', left: 100, top: 33, width: 24, height: 15, backgroundColor: C.white,
    borderTopRightRadius: 7, borderBottomRightRadius: 3, borderWidth: 1, borderColor: C.peachDark,
  },
  cab: {
    position: 'absolute', left: 85, top: 22, width: 22, height: 26, backgroundColor: C.white,
    borderTopLeftRadius: 2, borderTopRightRadius: 12, borderWidth: 1, borderRightWidth: 0, borderColor: C.peachDark,
  },
  cabWindow: {
    position: 'absolute', left: 89, top: 25, width: 15, height: 10, backgroundColor: '#BFE3F2',
    borderTopRightRadius: 9, borderRadius: 2, borderWidth: 1, borderColor: '#7FA9BC', overflow: 'hidden',
  },
  shine: { position: 'absolute', top: 0, left: 2, width: 5, height: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  cabDoor: {
    position: 'absolute', left: 88, top: 36, width: 13, height: 11, borderRadius: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)',
  },
  cabHandle: { position: 'absolute', left: 90, top: 38, width: 4, height: 1.5, borderRadius: 1, backgroundColor: '#9E9E9E' },
  mirror: { position: 'absolute', left: 103, top: 29, width: 3, height: 7, borderRadius: 1.5, backgroundColor: '#3B2A2F' },

  tail: { position: 'absolute', left: 2, top: 22, width: 3, height: 8, borderRadius: 1, backgroundColor: '#E53935' },
  rearBumper: { position: 'absolute', left: 0, top: 43, width: 8, height: 5, borderRadius: 1.5, backgroundColor: '#9E9E9E' },
  frontBumper: { position: 'absolute', left: 117, top: 44, width: 9, height: 4, borderRadius: 1.5, backgroundColor: '#9E9E9E' },
  headlight: { position: 'absolute', left: 121, top: 35, width: 4, height: 6, borderRadius: 1, backgroundColor: '#FFD54F' },
  beam: {
    position: 'absolute', left: 124, top: 33, width: 16, height: 10,
    borderTopRightRadius: 8, borderBottomRightRadius: 8, backgroundColor: 'rgba(255,235,150,0.35)',
  },

  arch: {
    position: 'absolute', top: 37, width: 22, height: 11,
    borderTopLeftRadius: 11, borderTopRightRadius: 11, backgroundColor: '#2B2024',
  },
  tire: {
    position: 'absolute', top: 39, width: 18, height: 18, borderRadius: 9, backgroundColor: '#1E1619',
  },
  rim: {
    position: 'absolute', left: 3, top: 3, width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#CFCFCF', alignItems: 'center', justifyContent: 'center',
  },
  spoke: { position: 'absolute', width: 10, height: 1.5, backgroundColor: '#8E8E8E' },
  hub: { position: 'absolute', left: 7, top: 7, width: 4, height: 4, borderRadius: 2, backgroundColor: '#6E6E6E' },
});
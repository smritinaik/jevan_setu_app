import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../lib/theme';

function Ring({ delay, size, color }: { delay: number; size: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    const t = setTimeout(() => {
      loop = Animated.loop(
        Animated.timing(v, { toValue: 1, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true })
      );
      loop.start();
    }, delay);
    return () => { clearTimeout(t); loop?.stop(); };
  }, []);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  return (
    <Animated.View
      style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, opacity, transform: [{ scale }],
      }}
    />
  );
}

type Props = {
  label: string;
  sub?: string;
  onPress: () => void;
  size?: number;
  color?: string;
  ripple?: boolean;
};

export default function RippleButton({ label, sub, onPress, size = 210, color = C.maroon, ripple = true }: Props) {
  return (
    <View style={{ width: size * 2.2, height: size * 2.2, alignItems: 'center', justifyContent: 'center' }}>
      {ripple && [0, 800, 1600].map((d) => <Ring key={d} delay={d} size={size} color={color} />)}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color, transform: [{ scale: pressed ? 0.95 : 1 }] },
        ]}
      >
        <Text style={styles.label}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center', justifyContent: 'center', elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    borderWidth: 6, borderColor: C.peach,
  },
  label: { color: C.white, fontSize: 44, fontWeight: '900', letterSpacing: 2 },
  sub: { color: C.peach, fontSize: 13, marginTop: 4, fontWeight: '600' },
});
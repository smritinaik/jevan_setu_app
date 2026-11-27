import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../../context/AuthContext';
import { C } from '../../../lib/theme';
import AmbulanceRoad, { LogoMark } from '../../../components/AmbulanceRoad';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  async function submit() {
    if (!email || !password) return Alert.alert('Enter email and password');
    setBusy(true);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) Alert.alert('Login failed', err);
  }

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <AmbulanceRoad />
      <KeyboardAvoidingView style={s.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={s.wrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.brand}>
            <Image source={require('../../../assets/logo.png')} style={s.logoImg} resizeMode="contain" />
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Welcome back</Text>
            <TextInput
              style={[s.input, focus === 'email' && s.inputFocus]}
              placeholder="Email"
              placeholderTextColor={C.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocus('email')}
              onBlur={() => setFocus(null)}
            />
            <TextInput
              style={[s.input, focus === 'password' && s.inputFocus]}
              placeholder="Password"
              placeholderTextColor={C.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocus('password')}
              onBlur={() => setFocus(null)}
            />
            <Pressable style={s.btn} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>LOGIN</Text>}
            </Pressable>
            <Link href={'/register' as any} style={s.link}>First time? Register with your access code</Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.peach },
  flex: { flex: 1 },
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 190 },
  brand: { alignItems: 'center', marginBottom: 22 },
  logo: { fontSize: 38, fontWeight: '900', color: C.maroon, marginTop: 12 },
  tag: { textAlign: 'center', color: C.muted, fontWeight: '600', marginTop: 2 },
  card: {
    backgroundColor: C.white, borderRadius: 24, padding: 22, elevation: 6, gap: 12,
    width: '100%', maxWidth: 420, alignSelf: 'center',
    shadowColor: C.maroonDark, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: C.maroon },
  input: {
    backgroundColor: C.peach, borderRadius: 12, padding: 14, color: C.text, fontSize: 16,
    borderWidth: 2, borderColor: 'transparent',
  },
  inputFocus: { borderColor: C.maroon, backgroundColor: C.white },
  btn: { backgroundColor: C.maroon, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  link: { color: C.maroon, textAlign: 'center', fontWeight: '700', marginTop: 4 },

  logoImg: { width: 230, height: 120, marginBottom: 12 },
});
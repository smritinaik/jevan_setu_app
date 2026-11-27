import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../../context/AuthContext';
import { C } from '../../../lib/theme';
import AmbulanceRoad, { LogoMark } from '../../../components/AmbulanceRoad';

export default function Register() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  async function submit() {
    if (!name || !email || !password || !code) return Alert.alert('Fill all fields');
    if (password.length < 6) return Alert.alert('Password must be at least 6 characters');
    setBusy(true);
    const err = await signUp(email, password, name, code);
    setBusy(false);
    if (err) Alert.alert('Registration failed', err);
    // on success the session starts and the layout redirects by role
  }

  const field = (key: string) => [s.input, focus === key && s.inputFocus];
  const focusProps = (key: string) => ({ onFocus: () => setFocus(key), onBlur: () => setFocus(null) });

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
            <TextInput style={field('name')} placeholder="Full name" placeholderTextColor={C.muted}
              value={name} onChangeText={setName} {...focusProps('name')} />
            <TextInput style={field('email')} placeholder="Email" placeholderTextColor={C.muted} autoCapitalize="none"
              keyboardType="email-address" value={email} onChangeText={setEmail} {...focusProps('email')} />
            <TextInput style={field('password')} placeholder="Password" placeholderTextColor={C.muted} secureTextEntry
              value={password} onChangeText={setPassword} {...focusProps('password')} />
            <TextInput style={field('code')} placeholder="Access code (e.g. DRV-1001)" placeholderTextColor={C.muted}
              autoCapitalize="characters" value={code} onChangeText={setCode} {...focusProps('code')} />
            <Pressable style={s.btn} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>CREATE ACCOUNT</Text>}
            </Pressable>
            <Link href={'/login' as any} style={s.link}>Already registered? Login</Link>
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
  brand: { alignItems: 'center', marginBottom: 18 },
  logo: { fontSize: 34, fontWeight: '900', color: C.maroon, marginTop: 10 },
  tag: { textAlign: 'center', color: C.muted, fontWeight: '600', marginTop: 2 },
  card: {
    backgroundColor: C.white, borderRadius: 24, padding: 22, elevation: 6, gap: 12,
    width: '100%', maxWidth: 420, alignSelf: 'center',
    shadowColor: C.maroonDark, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
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
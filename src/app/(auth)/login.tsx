import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { C } from '../../../lib/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email || !password) return Alert.alert('Enter email and password');
    setBusy(true);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) Alert.alert('Login failed', err);
  }

  return (
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={s.logo}>JeevanSetu</Text>
      <Text style={s.tag}>Clearing the way for every life</Text>
      <View style={s.card}>
        <TextInput style={s.input} placeholder="Email" placeholderTextColor={C.muted} autoCapitalize="none"
          keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor={C.muted} secureTextEntry
          value={password} onChangeText={setPassword} />
        <Pressable style={s.btn} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>LOGIN</Text>}
        </Pressable>
        <Link href={'/register' as any} style={s.link}>First time? Register with your access code</Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.peach, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 42, fontWeight: '900', color: C.maroon, textAlign: 'center' },
  tag: { textAlign: 'center', color: C.muted, marginBottom: 28, fontWeight: '600' },
  card: { backgroundColor: C.white, borderRadius: 20, padding: 20, elevation: 4, gap: 12 },
  input: { backgroundColor: C.peach, borderRadius: 12, padding: 14, color: C.text, fontSize: 16 },
  btn: { backgroundColor: C.maroon, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  link: { color: C.maroon, textAlign: 'center', fontWeight: '700', marginTop: 4 },
});
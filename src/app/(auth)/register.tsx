import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { C } from '../../../lib/theme';

export default function Register() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name || !email || !password || !code) return Alert.alert('Fill all fields');
    if (password.length < 6) return Alert.alert('Password must be at least 6 characters');
    setBusy(true);
    const err = await signUp(email, password, name, code);
    setBusy(false);
    if (err) Alert.alert('Registration failed', err);
    // on success the session starts and the layout redirects by role
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.peach }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap}>
        <Text style={s.logo}>Register</Text>
        <Text style={s.tag}>Use the unique code issued to you</Text>
        <View style={s.card}>
          <TextInput style={s.input} placeholder="Full name" placeholderTextColor={C.muted} value={name} onChangeText={setName} />
          <TextInput style={s.input} placeholder="Email" placeholderTextColor={C.muted} autoCapitalize="none"
            keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={s.input} placeholder="Password" placeholderTextColor={C.muted} secureTextEntry
            value={password} onChangeText={setPassword} />
          <TextInput style={s.input} placeholder="Access code (e.g. DRV-1001)" placeholderTextColor={C.muted}
            autoCapitalize="characters" value={code} onChangeText={setCode} />
          <Pressable style={s.btn} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>CREATE ACCOUNT</Text>}
          </Pressable>
          <Link href={'/login' as any} style={s.link}>Already registered? Login</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 36, fontWeight: '900', color: C.maroon, textAlign: 'center' },
  tag: { textAlign: 'center', color: C.muted, marginBottom: 24, fontWeight: '600' },
  card: { backgroundColor: C.white, borderRadius: 20, padding: 20, elevation: 4, gap: 12 },
  input: { backgroundColor: C.peach, borderRadius: 12, padding: 14, color: C.text, fontSize: 16 },
  btn: { backgroundColor: C.maroon, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  link: { color: C.maroon, textAlign: 'center', fontWeight: '700', marginTop: 4 },
});
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { C } from '../../lib/theme';

function Guard() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const first = segments[0] as string | undefined;
    if (!session) {
      if (first !== '(auth)') router.replace('/login' as any);
      return;
    }
    if (!profile) return; // profile still loading
    const target = profile.role === 'driver' ? 'driver' : 'police';
    if (first !== target) router.replace(`/${target}` as any);
  }, [session, profile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.peach, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.maroon} />
      </View>
    );
  }
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Guard />
    </AuthProvider>
  );
}
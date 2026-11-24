import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export type Role = 'driver' | 'police';
export type Profile = { id: string; email: string; full_name: string; role: Role };
export type Junction = { id: string; name: string; lat: number; lng: number };
export type Trip = {
  id: string; driver_id: string; driver_name: string; destination: string;
  junction_ids: string[]; lat: number | null; lng: number | null; status: string;
};
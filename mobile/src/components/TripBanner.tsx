import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientFor } from '../theme';
import { T } from './ui';

export function TripBanner({ destination, height = 84, subtitle, big }: { destination: string; height?: number; subtitle?: string; big?: boolean }) {
  const [a, b] = gradientFor(destination);
  return (
    <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height, padding: 16, justifyContent: 'flex-end' }}>
      <View>
        <T v={big ? 'display' : 'h2'} style={{ color: '#fff' }}>{destination}</T>
        {subtitle ? <T v="small" style={{ color: 'rgba(255,255,255,0.85)' }}>{subtitle}</T> : null}
      </View>
    </LinearGradient>
  );
}

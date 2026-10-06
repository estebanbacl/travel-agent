import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, useFonts,
} from '@expo-google-fonts/geist';
import HomeScreen from './src/screens/HomeScreen';
import NewPlanScreen from './src/screens/NewPlanScreen';
import PlanDetailScreen from './src/screens/PlanDetailScreen';
import { fonts, useTheme } from './src/theme';

export type RootStackParamList = {
  Home: undefined;
  NewPlan: undefined;
  PlanDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const t = useTheme();
  const [loaded] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold });
  if (!loaded) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator /></View>;
  }
  const isDark = t.bg === '#000000';
  const base = isDark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={{ ...base, colors: { ...base.colors, background: t.bg, card: t.bg, text: t.text, border: t.border, primary: t.text } }}>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 },
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewPlan" component={NewPlanScreen} options={{ title: 'New trip' }} />
        <Stack.Screen name="PlanDetail" component={PlanDetailScreen} options={{ title: '' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

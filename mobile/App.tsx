import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import NewPlanScreen from './src/screens/NewPlanScreen';
import PlanDetailScreen from './src/screens/PlanDetailScreen';

export type RootStackParamList = {
  Home: undefined;
  NewPlan: undefined;
  PlanDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Trips' }} />
        <Stack.Screen name="NewPlan" component={NewPlanScreen} options={{ title: 'New Trip' }} />
        <Stack.Screen name="PlanDetail" component={PlanDetailScreen} options={{ title: 'Itinerary' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

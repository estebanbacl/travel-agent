import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../api/client';
import type { TravelStyle } from '../api/types';
import { Button, Field } from '../components/ui';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NewPlan'>;
const STYLES: TravelStyle[] = ['budget', 'balanced', 'luxury', 'adventure'];

export default function NewPlanScreen({ navigation }: Props) {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('4');
  const [budget, setBudget] = useState('1500');
  const [currency, setCurrency] = useState('USD');
  const [style, setStyle] = useState<TravelStyle>('balanced');
  const [interests, setInterests] = useState('');
  const [startingPoint, setStartingPoint] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const durationDays = parseInt(days, 10);
    const totalBudget = parseFloat(budget);
    if (destination.trim().length < 2 || !(durationDays >= 1 && durationDays <= 21) || !(totalBudget > 0)) {
      Alert.alert('Check your input', 'Destination, 1-21 days and a positive budget are required.');
      return;
    }
    setLoading(true);
    try {
      const plan = await api.createPlan({
        destination: destination.trim(),
        durationDays,
        totalBudget,
        currency: currency.trim().toUpperCase().slice(0, 3) || 'USD',
        travelStyle: style,
        interests: interests.split(',').map((i) => i.trim()).filter(Boolean),
        startingPoint: startingPoint.trim() || undefined,
      });
      navigation.replace('PlanDetail', { id: plan.id });
    } catch (e) {
      Alert.alert('Could not generate plan', (e as Error).message);
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="Paris, France" />
      <Field label="Days" value={days} onChangeText={setDays} keyboardType="number-pad" />
      <Field label="Total budget" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" />
      <Field label="Currency" value={currency} onChangeText={setCurrency} autoCapitalize="characters" maxLength={3} />
      <Text style={s.label}>Travel style</Text>
      <View style={s.row}>
        {STYLES.map((st) => (
          <Pressable key={st} onPress={() => setStyle(st)} style={[s.chip, style === st && s.chipOn]}>
            <Text style={{ color: style === st ? '#fff' : colors.text }}>{st}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Interests (comma separated)" value={interests} onChangeText={setInterests} placeholder="museums, food, hiking" />
      <Field label="Starting point (optional)" value={startingPoint} onChangeText={setStartingPoint} />
      <Button title={loading ? 'Generating… (can take a minute)' : 'Generate itinerary'} onPress={submit} loading={loading} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  label: { color: colors.muted, marginBottom: 4, fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../api/client';
import type { TravelStyle } from '../api/types';
import { Banner, Button, Chip, Field, Screen, T } from '../components/ui';
import { useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NewPlan'>;

const STYLES: { id: TravelStyle; title: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'budget', title: 'Budget', desc: 'Hostels, street food, public transit', icon: 'tag' },
  { id: 'balanced', title: 'Balanced', desc: 'Comfortable stays, mix of local and classic', icon: 'sliders' },
  { id: 'luxury', title: 'Luxury', desc: 'Boutique hotels, fine dining, private transfers', icon: 'star' },
  { id: 'adventure', title: 'Adventure', desc: 'Outdoors, active days, off the beaten path', icon: 'wind' },
];
const SUGGESTED = ['Food', 'Museums', 'Hiking', 'Nightlife', 'Architecture', 'Beaches', 'Shopping', 'Local culture', 'Photography'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'MXN', 'COP'];
const STEPS = ['Understanding your preferences', 'Choosing places worth your time', 'Mapping routes between stops', 'Estimating costs against your budget', 'Polishing the itinerary'];

export default function NewPlanScreen({ navigation }: Props) {
  const t = useTheme();
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(4);
  const [budget, setBudget] = useState('1500');
  const [currency, setCurrency] = useState('USD');
  const [style, setStyle] = useState<TravelStyle>('balanced');
  const [interests, setInterests] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [startingPoint, setStartingPoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(id);
  }, [loading]);

  const toggle = (i: string) => setInterests((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  const addCustom = () => {
    const v = custom.trim();
    if (v && !interests.includes(v)) setInterests([...interests, v]);
    setCustom('');
  };

  const totalBudget = parseFloat(budget);
  const valid = destination.trim().length >= 2 && totalBudget > 0;

  const submit = async () => {
    setError(null);
    setStep(0);
    setLoading(true);
    try {
      const plan = await api.createPlan({
        destination: destination.trim(), durationDays: days, totalBudget, currency, travelStyle: style,
        interests, startingPoint: startingPoint.trim() || undefined,
      });
      navigation.replace('PlanDetail', { id: plan.id });
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 18 }}>
        <ActivityIndicator size="large" color={t.text} />
        <T v="h1" style={{ textAlign: 'center' }}>Building your trip to {destination.trim()}</T>
        <View style={{ gap: 8, alignItems: 'flex-start' }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', opacity: i > step ? 0.35 : 1 }}>
              <Feather name={i < step ? 'check-circle' : 'circle'} size={16} color={i < step ? t.under_budget : t.muted} />
              <T color={i === step ? 'text' : 'muted'}>{s}</T>
            </View>
          ))}
        </View>
        <T v="small" color="faint">This can take up to a minute.</T>
      </View>
    );
  }

  return (
    <Screen>
      <T v="h1" style={{ marginBottom: 4 }}>Plan a new trip</T>
      <T color="muted" style={{ marginBottom: 24 }}>A few details and we'll take it from here.</T>
      {error && <Banner message={error} onClose={() => setError(null)} />}

      <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="Lisbon, Portugal" autoFocus />

      <T v="label" color="muted" style={{ textTransform: 'uppercase', marginBottom: 6 }}>Duration</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <Button title="−" variant="secondary" small onPress={() => setDays((d) => Math.max(1, d - 1))} />
        <T v="h2" style={{ minWidth: 70, textAlign: 'center' }}>{days} {days === 1 ? 'day' : 'days'}</T>
        <Button title="+" variant="secondary" small onPress={() => setDays((d) => Math.min(21, d + 1))} />
      </View>

      <Field label="Total budget" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: -6, marginBottom: 20 }}>
        {CURRENCIES.map((c) => <Chip key={c} label={c} selected={currency === c} onPress={() => setCurrency(c)} />)}
      </View>

      <T v="label" color="muted" style={{ textTransform: 'uppercase', marginBottom: 8 }}>Travel style</T>
      <View style={{ gap: 8, marginBottom: 22 }}>
        {STYLES.map((s) => {
          const on = style === s.id;
          return (
            <Pressable key={s.id} onPress={() => setStyle(s.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: on ? 2 : 1, borderColor: on ? t.text : t.border, backgroundColor: t.surface }}>
              <Feather name={s.icon} size={18} color={on ? t.text : t.muted} />
              <View style={{ flex: 1 }}>
                <T v="h3">{s.title}</T>
                <T v="small" color="muted">{s.desc}</T>
              </View>
              {on && <Feather name="check" size={18} color={t.text} />}
            </Pressable>
          );
        })}
      </View>

      <T v="label" color="muted" style={{ textTransform: 'uppercase', marginBottom: 8 }}>Interests</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {[...SUGGESTED, ...interests.filter((i) => !SUGGESTED.includes(i))].map((i) => (
          <Chip key={i} label={i} selected={interests.includes(i)} onPress={() => toggle(i)} />
        ))}
      </View>
      <Field label="" value={custom} onChangeText={setCustom} placeholder="Add your own and press enter" onSubmitEditing={addCustom} returnKeyType="done" />

      <Field label="Starting point (optional)" value={startingPoint} onChangeText={setStartingPoint} placeholder="Airport, hotel or neighborhood" />

      <Button title="Generate itinerary" icon="zap" onPress={submit} disabled={!valid} />
    </Screen>
  );
}

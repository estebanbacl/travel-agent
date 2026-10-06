import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../api/client';
import type { TravelPlan } from '../api/types';
import { Button, Card, Field } from '../components/ui';
import { colors, money } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'>;

export default function PlanDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [instruction, setInstruction] = useState('');
  const [dayText, setDayText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getPlan(id).then(setPlan).catch((e) => Alert.alert('Error', e.message));
  }, [id]);

  if (!plan) return <Text style={{ padding: 16 }}>Loading…</Text>;
  const cur = plan.request.currency;
  const b = plan.breakdown;

  const refine = async () => {
    const day = dayText ? parseInt(dayText, 10) : undefined;
    if (day !== undefined && !(day >= 1 && day <= plan.totalDays)) {
      Alert.alert('Day out of range', `Pick a day from 1 to ${plan.totalDays}, or leave empty.`);
      return;
    }
    setBusy(true);
    try {
      setPlan(await api.refinePlan(id, instruction.trim(), day));
      setInstruction('');
    } catch (e) {
      Alert.alert('Could not refine', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert('Delete trip?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.deletePlan(id); navigation.goBack(); } },
    ]);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={s.h1}>{plan.destination}</Text>
      <Card>
        <Row k="Accommodation" v={money(b.accommodation, cur)} />
        <Row k="Food" v={money(b.food, cur)} />
        <Row k="Activities" v={money(b.activities, cur)} />
        <Row k="Transit" v={money(b.transit, cur)} />
        <Row k="Total" v={money(b.total, cur)} bold />
        <Row k="Budget" v={money(b.budget, cur)} />
        <Text style={{ color: colors[plan.budgetStatus], marginTop: 6 }}>
          {plan.budgetStatus.replace('_', ' ')} ({b.variance >= 0 ? '+' : ''}{money(b.variance, cur)})
        </Text>
      </Card>

      {plan.days.map((d) => (
        <Card key={d.dayNumber}>
          <Text style={s.h2}>Day {d.dayNumber} · {d.theme}</Text>
          {d.activities.map((a, i) => (
            <View key={i} style={{ marginTop: 8 }}>
              <Text style={s.slot}>{a.timeSlot}</Text>
              <Text style={s.bold}>{a.title} — {money(a.estimatedCost, cur)}</Text>
              <Text style={s.muted}>{a.locationName}</Text>
              <Text style={{ color: colors.text }}>{a.description}</Text>
            </View>
          ))}
          {d.routes.map((r, i) => (
            <Text key={i} style={[s.muted, { marginTop: 6 }]}>
              ➜ {r.travelMode} {r.estimatedDurationMinutes} min, {r.fromLocation} → {r.toLocation} ({money(r.estimatedCost, cur)})
            </Text>
          ))}
          <Text style={[s.bold, { marginTop: 8 }]}>Day total: {money(d.dailyCostTotal, cur)}</Text>
        </Card>
      ))}

      <Card>
        <Text style={s.h2}>Adjust this plan</Text>
        <Field label="What should change?" value={instruction} onChangeText={setInstruction} placeholder="Make day 2 cheaper" multiline />
        <Field label="Only day (optional)" value={dayText} onChangeText={setDayText} keyboardType="number-pad" />
        <Button title="Apply change" onPress={refine} loading={busy} disabled={instruction.trim().length < 3} />
      </Card>
      <Button title="Delete trip" onPress={remove} />
    </ScrollView>
  );
}

const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <View style={s.row}>
    <Text style={bold ? s.bold : s.muted}>{k}</Text>
    <Text style={bold ? s.bold : { color: colors.text }}>{v}</Text>
  </View>
);

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: colors.text },
  h2: { fontSize: 16, fontWeight: '600', color: colors.text },
  slot: { color: colors.primary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  bold: { fontWeight: '600', color: colors.text },
  muted: { color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
});

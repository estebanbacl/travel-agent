import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../api/client';
import type { ActivityItem, RouteSegment, TravelPlan } from '../api/types';
import { BudgetBar } from '../components/BudgetBar';
import { TripBanner } from '../components/TripBanner';
import { Banner, Button, Card, Field, Chip, Screen, Skeleton, StatusBadge, T, confirmAction } from '../components/ui';
import { money, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'>;

const SLOT_ICON: Record<ActivityItem['timeSlot'], keyof typeof Feather.glyphMap> = { Morning: 'sunrise', Afternoon: 'sun', Evening: 'moon' };
const MODE_ICON: Record<RouteSegment['travelMode'], keyof typeof MaterialCommunityIcons.glyphMap> = { walk: 'walk', transit: 'bus', taxi: 'taxi', drive: 'car' };
const QUICK = ['Make it cheaper', 'More outdoor activities', 'Add local food spots', 'Slower pace, fewer stops'];

export default function PlanDetailScreen({ route, navigation }: Props) {
  const t = useTheme();
  const { id } = route.params;
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [day, setDay] = useState(1);
  const [instruction, setInstruction] = useState('');
  const [onlyThisDay, setOnlyThisDay] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPlan(id).then(setPlan).catch((e) => setError(e.message));
  }, [id]);

  if (!plan) {
    return (
      <Screen>
        {error ? <Banner message={error} /> : <><Skeleton h={120} /><Skeleton h={24} w="60%" style={{ marginTop: 16 }} /><Skeleton h={160} style={{ marginTop: 16 }} /></>}
      </Screen>
    );
  }

  const cur = plan.request.currency;
  const d = plan.days.find((x) => x.dayNumber === day) ?? plan.days[0];

  const refine = async (text = instruction) => {
    if (text.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      setPlan(await api.refinePlan(id, text.trim(), onlyThisDay ? d.dayNumber : undefined));
      setInstruction('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    confirmAction('Delete this trip?', async () => {
      try { await api.deletePlan(id); navigation.goBack(); } catch (e) { setError((e as Error).message); }
    });

  return (
    <Screen>
      <Card style={{ marginBottom: 16 }}>
        <TripBanner destination={plan.destination} subtitle={`${plan.totalDays} days · ${plan.request.travelStyle}`} height={132} big />
        <View style={{ padding: 18, gap: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
            <View>
              <T v="label" color="muted" style={{ textTransform: 'uppercase' }}>Estimated total</T>
              <T v="display">{money(plan.totalEstimatedCost, cur)}</T>
            </View>
            <View style={{ alignItems: 'flex-start', gap: 6 }}>
              <StatusBadge status={plan.budgetStatus} />
              <T v="small" color="muted">
                {plan.breakdown.variance >= 0 ? '+' : '−'}{money(Math.abs(plan.breakdown.variance), cur)} vs {money(plan.breakdown.budget, cur)} budget
              </T>
            </View>
          </View>
          <BudgetBar b={plan.breakdown} currency={cur} />
        </View>
      </Card>

      {error && <Banner message={error} onClose={() => setError(null)} />}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {plan.days.map((x) => <Chip key={x.dayNumber} label={`Day ${x.dayNumber}`} selected={x.dayNumber === d.dayNumber} onPress={() => setDay(x.dayNumber)} />)}
      </ScrollView>

      <View style={{ marginTop: 12, marginBottom: 6 }}>
        <T v="h1">{d.theme}</T>
        <T color="muted">Day total {money(d.dailyCostTotal, cur)}</T>
      </View>

      <View style={{ marginTop: 14 }}>
        {d.activities.map((a, i) => {
          const r = d.routes[i];
          return (
            <View key={i}>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ alignItems: 'center', width: 32 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.surfaceAlt, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={SLOT_ICON[a.timeSlot]} size={15} color={t.text} />
                  </View>
                  {i < d.activities.length - 1 && <View style={{ flex: 1, width: 1, backgroundColor: t.border, marginVertical: 4 }} />}
                </View>
                <View style={{ flex: 1, paddingBottom: 12 }}>
                  <T v="label" color="muted" style={{ textTransform: 'uppercase' }}>{a.timeSlot}</T>
                  <Card style={{ padding: 14, marginTop: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                      <T v="h2" style={{ flex: 1 }}>{a.title}</T>
                      <T v="h3" color="muted">{a.estimatedCost > 0 ? money(a.estimatedCost, cur) : 'Free'}</T>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginVertical: 4 }}>
                      <Feather name="map-pin" size={12} color={t.accent} />
                      <T v="small" style={{ color: t.accent }}>{a.locationName}</T>
                    </View>
                    <T color="muted">{a.description}</T>
                  </Card>
                  {r && i < d.activities.length - 1 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingLeft: 2 }}>
                      <MaterialCommunityIcons name={MODE_ICON[r.travelMode]} size={16} color={t.muted} />
                      <T v="small" color="muted">
                        {r.estimatedDurationMinutes} min {r.travelMode === 'walk' ? 'walk' : r.travelMode} · {r.estimatedCost > 0 ? money(r.estimatedCost, cur) : 'Free'}
                      </T>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <Card style={{ padding: 18, marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Feather name="message-circle" size={16} color={t.text} />
          <T v="h2">Ask the agent to adjust</T>
        </View>
        <T v="small" color="muted" style={{ marginBottom: 12 }}>Describe what you'd change and the plan will be rebalanced.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {QUICK.map((q) => <Chip key={q} label={q} onPress={() => !busy && refine(q)} />)}
        </View>
        <Field label="" value={instruction} onChangeText={setInstruction} placeholder="e.g. Swap the museum for something outdoors" multiline editable={!busy} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Switch value={onlyThisDay} onValueChange={setOnlyThisDay} />
          <T v="small" color="muted">Only change Day {d.dayNumber}</T>
        </View>
        <Button title={busy ? 'Updating plan…' : 'Apply change'} icon="refresh-cw" onPress={() => refine()} loading={busy} disabled={instruction.trim().length < 3} />
      </Card>

      <Button title="Delete trip" variant="danger" icon="trash-2" onPress={remove} style={{ marginTop: 16 }} />
    </Screen>
  );
}

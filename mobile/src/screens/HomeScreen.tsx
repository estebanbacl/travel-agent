import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../api/client';
import type { PlanSummary } from '../api/types';
import { BudgetBar } from '../components/BudgetBar';
import { TripBanner } from '../components/TripBanner';
import { Banner, Button, Card, Skeleton, StatusBadge, T } from '../components/ui';
import { money, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const cols = width >= 820 ? 2 : 1;
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    setError(null);
    try {
      setPlans(await api.listPlans());
    } catch (e) {
      setError((e as Error).message);
      setPlans((p) => p ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const header = (
    <View style={{ paddingTop: 36, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T v="label" color="muted" style={{ textTransform: 'uppercase', marginBottom: 6 }}>Travel planner</T>
          <T v="display">Where to next?</T>
        </View>
        <Button title="New trip" icon="plus" small onPress={() => navigation.navigate('NewPlan')} />
      </View>
      {error && <View style={{ marginTop: 16 }}><Banner message={`Can't reach the server: ${error}`} /></View>}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        key={cols}
        numColumns={cols}
        data={plans ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 20, width: '100%', maxWidth: 960, alignSelf: 'center' }}
        columnWrapperStyle={cols > 1 ? { gap: 16 } : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          plans === null ? (
            <Card style={{ padding: 16, gap: 10 }}><Skeleton h={72} /><Skeleton h={18} w="50%" /><Skeleton h={10} /></Card>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 56, gap: 10 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="compass" size={24} color={t.muted} />
              </View>
              <T v="h2">No trips yet</T>
              <T color="muted" style={{ textAlign: 'center', maxWidth: 320 }}>
                Tell us where you want to go and your budget. We'll build a day-by-day plan with routes and costs.
              </T>
              <Button title="Plan your first trip" icon="arrow-right" onPress={() => navigation.navigate('NewPlan')} style={{ marginTop: 8 }} />
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('PlanDetail', { id: item.id })} style={{ flex: 1, marginBottom: 16 }}>
            <TripBanner destination={item.destination} subtitle={`${item.totalDays} days`} />
            <View style={{ padding: 16, gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T v="h2">{money(item.totalEstimatedCost, item.currency)}</T>
                <StatusBadge status={item.budgetStatus} />
              </View>
              <T v="small" color="muted">{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</T>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

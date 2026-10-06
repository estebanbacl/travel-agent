import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../api/client';
import type { PlanSummary } from '../api/types';
import { Button, Card } from '../components/ui';
import { colors, money } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPlans(await api.listPlans());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={s.container}>
      {error && <Text style={s.error}>Could not load trips: {error}</Text>}
      <FlatList
        data={plans}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={!loading ? <Text style={s.empty}>No trips yet. Plan your first one!</Text> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('PlanDetail', { id: item.id })}>
            <Card>
              <Text style={s.title}>{item.destination}</Text>
              <Text style={s.muted}>{item.totalDays} days · {money(item.totalEstimatedCost, item.currency)}</Text>
              <Text style={{ color: colors[item.budgetStatus], marginTop: 4 }}>{item.budgetStatus.replace('_', ' ')}</Text>
            </Card>
          </Pressable>
        )}
      />
      <Button title="Plan a new trip" onPress={() => navigation.navigate('NewPlan')} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  muted: { color: colors.muted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  error: { color: colors.over_budget, marginBottom: 8 },
});

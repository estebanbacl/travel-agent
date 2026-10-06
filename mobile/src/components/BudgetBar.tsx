import React from 'react';
import { View } from 'react-native';
import { CostBreakdown } from '../api/types';
import { categoryColors, money, useTheme } from '../theme';
import { T } from './ui';

const ROWS: { key: keyof typeof categoryColors; label: string }[] = [
  { key: 'accommodation', label: 'Stay' }, { key: 'food', label: 'Food' },
  { key: 'activities', label: 'Activities' }, { key: 'transit', label: 'Transit' },
];

export function BudgetBar({ b, currency, compact }: { b: CostBreakdown; currency: string; compact?: boolean }) {
  const t = useTheme();
  const scale = Math.max(b.total, b.budget) || 1;
  const budgetPos = `${(b.budget / scale) * 100}%` as `${number}%`;
  return (
    <View>
      <View style={{ height: compact ? 6 : 10, borderRadius: 6, backgroundColor: t.surfaceAlt, flexDirection: 'row', overflow: 'visible' }}>
        {ROWS.map((r) => (
          <View key={r.key} style={{ width: `${(b[r.key] / scale) * 100}%` as `${number}%`, backgroundColor: categoryColors[r.key], borderRadius: 2, marginRight: 1 }} />
        ))}
        <View style={{ position: 'absolute', left: budgetPos, top: -3, bottom: -3, width: 2, backgroundColor: t.text }} />
      </View>
      {!compact && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 14 }}>
          {ROWS.map((r) => (
            <View key={r.key} style={{ minWidth: 110 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: categoryColors[r.key] }} />
                <T v="small" color="muted">{r.label}</T>
              </View>
              <T v="h3">{money(b[r.key], currency)}</T>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

import React from 'react';
import {
  ActivityIndicator, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput,
  TextInputProps, TextProps, TextStyle, View, ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BudgetStatus } from '../api/types';
import { fonts, Theme, useTheme } from '../theme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label';
const SPEC: Record<Variant, { size: number; weight: keyof typeof fonts; lh: number; ls?: number }> = {
  display: { size: 34, weight: 'bold', lh: 40, ls: -1 },
  h1: { size: 26, weight: 'bold', lh: 32, ls: -0.6 },
  h2: { size: 18, weight: 'semibold', lh: 24, ls: -0.2 },
  h3: { size: 15, weight: 'semibold', lh: 21 },
  body: { size: 15, weight: 'regular', lh: 22 },
  small: { size: 13, weight: 'regular', lh: 18 },
  label: { size: 12, weight: 'medium', lh: 16, ls: 0.4 },
};

export function T({ v = 'body', color, style, ...rest }: TextProps & { v?: Variant; color?: keyof Theme }) {
  const t = useTheme();
  const s = SPEC[v];
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts[s.weight], fontSize: s.size, lineHeight: s.lh, letterSpacing: s.ls, color: t[color ?? 'text'] },
        style,
      ]}
    />
  );
}

/** Centered, max-width page container (reads well on web, full-bleed on phones). */
export function Screen({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48, width: '100%', maxWidth: 760, alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const t = useTheme();
  const base: ViewStyle = { backgroundColor: t.surface, borderRadius: 14, borderWidth: 1, borderColor: t.border, overflow: 'hidden' };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed, hovered }: any) => [base, hovered && { borderColor: t.borderStrong }, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  );
}

type BtnProps = {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Feather.glyphMap; loading?: boolean; disabled?: boolean; small?: boolean; style?: StyleProp<ViewStyle>;
};
export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, small, style }: BtnProps) {
  const t = useTheme();
  const palette = {
    primary: { bg: t.primary, fg: t.onPrimary, bd: t.primary },
    secondary: { bg: t.surface, fg: t.text, bd: t.borderStrong },
    ghost: { bg: 'transparent', fg: t.muted, bd: 'transparent' },
    danger: { bg: 'transparent', fg: t.danger, bd: 'transparent' },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: palette.bg, borderColor: palette.bd, borderWidth: 1, borderRadius: 10,
          paddingVertical: small ? 8 : 13, paddingHorizontal: small ? 12 : 18,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={palette.fg} size="small" /> : (
        <>
          {icon && <Feather name={icon} size={small ? 14 : 16} color={palette.fg} />}
          <Text style={{ color: palette.fg, fontFamily: fonts.semibold, fontSize: small ? 13 : 15 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, style, ...props }: { label: string; hint?: string } & TextInputProps) {
  const t = useTheme();
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      <T v="label" color="muted" style={{ marginBottom: 6, textTransform: 'uppercase' }}>{label}</T>
      <TextInput
        placeholderTextColor={t.faint}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[
          {
            backgroundColor: t.surface, borderWidth: 1, borderColor: focus ? t.text : t.border, borderRadius: 10,
            paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, fontFamily: fonts.regular, color: t.text,
          },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
          style,
        ]}
        {...props}
      />
      {hint ? <T v="small" color="faint" style={{ marginTop: 4 }}>{hint}</T> : null}
    </View>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: keyof typeof Feather.glyphMap }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999,
        borderWidth: 1, borderColor: selected ? t.primary : t.border, backgroundColor: selected ? t.primary : t.surface,
      }}
    >
      {icon && <Feather name={icon} size={13} color={selected ? t.onPrimary : t.muted} />}
      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: selected ? t.onPrimary : t.text }}>{label}</Text>
    </Pressable>
  );
}

const STATUS_LABEL: Record<BudgetStatus, string> = {
  under_budget: 'Under budget', on_budget: 'On budget', over_budget: 'Over budget',
};
export function StatusBadge({ status }: { status: BudgetStatus }) {
  const t = useTheme();
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t[`${status}_bg`], paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t[status] }} />
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: t[status] }}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function Banner({ message, onClose }: { message: string; onClose?: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: t.over_budget_bg, borderRadius: 10, padding: 12, marginBottom: 16 }}>
      <Feather name="alert-circle" size={16} color={t.danger} style={{ marginTop: 2 }} />
      <T v="small" style={{ flex: 1, color: t.danger }}>{message}</T>
      {onClose && <Feather name="x" size={16} color={t.danger} onPress={onClose} />}
    </View>
  );
}

export function Skeleton({ h = 16, w = '100%', style }: { h?: number; w?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ height: h, width: w, borderRadius: 8, backgroundColor: t.surfaceAlt }, style]} />;
}

export const hairline = (t: Theme): ViewStyle => ({ height: StyleSheet.hairlineWidth, backgroundColor: t.border });
export const labelStyle: TextStyle = { textTransform: 'uppercase' };

/** window.confirm on web (Alert.alert buttons are no-ops there), native Alert elsewhere. */
export function confirmAction(title: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(title)) onYes();
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: onYes }]);
  }
}

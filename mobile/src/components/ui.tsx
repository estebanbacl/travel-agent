import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme';

export const Button = ({ title, onPress, loading, disabled }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={[s.btn, (disabled || loading) && { opacity: 0.5 }]}
  >
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{title}</Text>}
  </Pressable>
);

export const Field = ({ label, ...props }: { label: string } & TextInputProps) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput style={s.input} placeholderTextColor={colors.muted} {...props} />
  </View>
);

export const Card = ({ children }: { children: React.ReactNode }) => <View style={s.card}>{children}</View>;

const s = StyleSheet.create({
  btn: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  label: { color: colors.muted, marginBottom: 4, fontSize: 13 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 16, color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
});

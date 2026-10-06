export const colors = {
  bg: '#F6F7F9', card: '#FFFFFF', text: '#14181F', muted: '#6B7280',
  primary: '#2563EB', border: '#E5E7EB',
  under_budget: '#16A34A', on_budget: '#CA8A04', over_budget: '#DC2626',
};
export const money = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
